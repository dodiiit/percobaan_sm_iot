const express = require('express');
const mysql = require('mysql2/promise');
const WebSocket = require('ws');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'password',
  database: process.env.DB_NAME || 'indowater'
};

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

// Email configuration for alerts
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'localhost',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

// Monitoring data storage
let monitoringData = {
  systemHealth: {
    status: 'healthy',
    lastCheck: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: 0
  },
  errors: [],
  performance: [],
  alerts: [],
  logs: []
};

// Log file paths
const logPaths = {
  app: '/app/logs/app.log',
  error: '/app/logs/error.log',
  webhook: '/app/logs/webhook_retry.log'
};

// Utility functions
function broadcastToClients(data) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

async function checkDatabaseHealth() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();
    return { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}

async function getErrorStats() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get error counts from last 24 hours
    const [rows] = await connection.execute(`
      SELECT 
        COUNT(*) as total_errors,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 END) as errors_last_hour,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as errors_last_24h
      FROM error_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `);
    
    await connection.end();
    return rows[0] || { total_errors: 0, errors_last_hour: 0, errors_last_24h: 0 };
  } catch (error) {
    console.error('Error getting error stats:', error);
    return { total_errors: 0, errors_last_hour: 0, errors_last_24h: 0 };
  }
}

async function getPerformanceMetrics() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Get average response times
    const [rows] = await connection.execute(`
      SELECT 
        AVG(response_time) as avg_response_time,
        MAX(response_time) as max_response_time,
        MIN(response_time) as min_response_time,
        COUNT(*) as total_requests
      FROM request_logs 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    await connection.end();
    return rows[0] || { avg_response_time: 0, max_response_time: 0, min_response_time: 0, total_requests: 0 };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return { avg_response_time: 0, max_response_time: 0, min_response_time: 0, total_requests: 0 };
  }
}

function parseLogFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    return lines.slice(-100).map(line => {
      try {
        // Try to parse as JSON (structured logs)
        return JSON.parse(line);
      } catch {
        // Fallback to plain text
        return { message: line, timestamp: new Date().toISOString() };
      }
    });
  } catch (error) {
    console.error(`Error parsing log file ${filePath}:`, error);
    return [];
  }
}

function checkAlerts() {
  const alerts = [];
  
  // Check error rate
  if (monitoringData.errors.length > 10) {
    alerts.push({
      type: 'error_rate',
      severity: 'high',
      message: `High error rate detected: ${monitoringData.errors.length} errors in the last hour`,
      timestamp: new Date()
    });
  }
  
  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
  
  if (memoryUsagePercent > 80) {
    alerts.push({
      type: 'memory',
      severity: 'warning',
      message: `High memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      timestamp: new Date()
    });
  }
  
  // Check log file sizes
  Object.entries(logPaths).forEach(([name, path]) => {
    try {
      if (fs.existsSync(path)) {
        const stats = fs.statSync(path);
        const sizeInMB = stats.size / (1024 * 1024);
        
        if (sizeInMB > 100) {
          alerts.push({
            type: 'log_size',
            severity: 'warning',
            message: `Large log file detected: ${name}.log (${sizeInMB.toFixed(2)} MB)`,
            timestamp: new Date()
          });
        }
      }
    } catch (error) {
      console.error(`Error checking log file ${path}:`, error);
    }
  });
  
  return alerts;
}

async function sendAlert(alert) {
  try {
    const mailOptions = {
      from: process.env.ALERT_FROM_EMAIL || 'monitoring@indowater.com',
      to: process.env.ALERT_TO_EMAIL || 'admin@indowater.com',
      subject: `IndoWater Alert: ${alert.type} - ${alert.severity}`,
      html: `
        <h2>IndoWater System Alert</h2>
        <p><strong>Type:</strong> ${alert.type}</p>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
        <hr>
        <p>Please check the monitoring dashboard for more details.</p>
      `
    };
    
    await emailTransporter.sendMail(mailOptions);
    console.log('Alert email sent:', alert.type);
  } catch (error) {
    console.error('Error sending alert email:', error);
  }
}

// API Routes
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const errorStats = await getErrorStats();
  const performanceMetrics = await getPerformanceMetrics();
  
  const health = {
    status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
    timestamp: new Date(),
    database: dbHealth,
    errors: errorStats,
    performance: performanceMetrics,
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }
  };
  
  res.json(health);
});

app.get('/api/logs/:type', (req, res) => {
  const { type } = req.params;
  const logPath = logPaths[type];
  
  if (!logPath) {
    return res.status(404).json({ error: 'Log type not found' });
  }
  
  const logs = parseLogFile(logPath);
  res.json(logs);
});

app.get('/api/metrics', async (req, res) => {
  const errorStats = await getErrorStats();
  const performanceMetrics = await getPerformanceMetrics();
  
  res.json({
    errors: errorStats,
    performance: performanceMetrics,
    system: monitoringData.systemHealth,
    alerts: monitoringData.alerts
  });
});

app.get('/api/alerts', (req, res) => {
  res.json(monitoringData.alerts);
});

// Dashboard HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>IndoWater Monitoring Dashboard</title>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1200px; margin: 0 auto; }
            .header { background: #0288d1; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .status-healthy { color: #4caf50; }
            .status-warning { color: #ff9800; }
            .status-error { color: #f44336; }
            .metric { display: flex; justify-content: space-between; margin: 10px 0; }
            .chart-container { height: 300px; }
            .log-entry { padding: 8px; margin: 4px 0; background: #f9f9f9; border-radius: 4px; font-family: monospace; font-size: 12px; }
            .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
            .alert-warning { background: #fff3cd; border: 1px solid #ffeaa7; }
            .alert-error { background: #f8d7da; border: 1px solid #f5c6cb; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>IndoWater System Monitoring</h1>
                <p>Real-time monitoring dashboard for IndoWater Smart Water Management System</p>
            </div>
            
            <div class="grid">
                <div class="card">
                    <h3>System Health</h3>
                    <div id="system-health">Loading...</div>
                </div>
                
                <div class="card">
                    <h3>Error Statistics</h3>
                    <div id="error-stats">Loading...</div>
                </div>
                
                <div class="card">
                    <h3>Performance Metrics</h3>
                    <div id="performance-metrics">Loading...</div>
                </div>
                
                <div class="card">
                    <h3>Active Alerts</h3>
                    <div id="alerts">Loading...</div>
                </div>
            </div>
            
            <div class="grid" style="margin-top: 20px;">
                <div class="card">
                    <h3>Response Time Chart</h3>
                    <div class="chart-container">
                        <canvas id="responseTimeChart"></canvas>
                    </div>
                </div>
                
                <div class="card">
                    <h3>Error Rate Chart</h3>
                    <div class="chart-container">
                        <canvas id="errorRateChart"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="card" style="margin-top: 20px;">
                <h3>Recent Logs</h3>
                <div id="recent-logs">Loading...</div>
            </div>
        </div>
        
        <script>
            // WebSocket connection for real-time updates
            const ws = new WebSocket('ws://localhost:8080');
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                updateDashboard(data);
            };
            
            // Initialize charts
            const responseTimeChart = new Chart(document.getElementById('responseTimeChart'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: [],
                        borderColor: '#0288d1',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            const errorRateChart = new Chart(document.getElementById('errorRateChart'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Errors per Hour',
                        data: [],
                        backgroundColor: '#f44336'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            function updateDashboard(data) {
                // Update system health
                document.getElementById('system-health').innerHTML = 
                    '<div class="metric"><span>Status:</span><span class="status-' + data.status + '">' + data.status.toUpperCase() + '</span></div>' +
                    '<div class="metric"><span>Uptime:</span><span>' + Math.floor(data.uptime / 3600) + 'h ' + Math.floor((data.uptime % 3600) / 60) + 'm</span></div>' +
                    '<div class="metric"><span>Memory:</span><span>' + Math.round(data.memory.heapUsed / 1024 / 1024) + ' MB</span></div>';
                
                // Update other sections...
            }
            
            // Fetch initial data
            fetch('/api/health')
                .then(response => response.json())
                .then(data => updateDashboard(data));
            
            // Refresh data every 30 seconds
            setInterval(() => {
                fetch('/api/health')
                    .then(response => response.json())
                    .then(data => updateDashboard(data));
            }, 30000);
        </script>
    </body>
    </html>
  `);
});

// Scheduled tasks
cron.schedule('*/5 * * * *', async () => {
  // Check system health every 5 minutes
  console.log('Running health check...');
  
  const dbHealth = await checkDatabaseHealth();
  const errorStats = await getErrorStats();
  const performanceMetrics = await getPerformanceMetrics();
  const alerts = checkAlerts();
  
  // Update monitoring data
  monitoringData.systemHealth = {
    status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
    lastCheck: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbHealth
  };
  
  monitoringData.errors = errorStats;
  monitoringData.performance = performanceMetrics;
  monitoringData.alerts = alerts;
  
  // Send alerts if any
  for (const alert of alerts) {
    if (alert.severity === 'high' || alert.severity === 'critical') {
      await sendAlert(alert);
    }
  }
  
  // Broadcast to connected clients
  broadcastToClients(monitoringData);
});

// Start server
app.listen(port, () => {
  console.log(`IndoWater Monitoring Dashboard running on port ${port}`);
  console.log(`WebSocket server running on port 8080`);
});