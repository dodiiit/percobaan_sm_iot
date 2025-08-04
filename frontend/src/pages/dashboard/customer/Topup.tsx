import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  BuildingLibraryIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  BeakerIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { meterAPI, paymentAPI } from '../../../services/api';
import { toast } from 'react-toastify';

interface Meter {
  id: string;
  meter_number: string;
  location: string;
  credit_balance: number;
  status: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: React.ElementType;
}

const Topup: React.FC = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [selectedMeter, setSelectedMeter] = useState<string>('');
  const [amount, setAmount] = useState<number>(100000);
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentStep, setPaymentStep] = useState<number>(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const paymentMethods: PaymentMethod[] = [
    { id: 'credit_card', name: 'Credit Card', type: 'card', icon: CreditCardIcon },
    { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank', icon: BuildingLibraryIcon },
    { id: 'e_wallet', name: 'E-Wallet', type: 'wallet', icon: DevicePhoneMobileIcon },
    { id: 'cash', name: 'Cash/Voucher', type: 'cash', icon: BanknotesIcon }
  ];

  const predefinedAmounts = [50000, 100000, 200000, 500000];

  useEffect(() => {
    fetchMeters();
  }, []);

  const fetchMeters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use real API
      const response = await meterAPI.getCustomerMeters();
      
      if (response.data && response.data.status === 'success') {
        const metersData = response.data.data || [];
        setMeters(metersData);
        
        if (metersData.length > 0) {
          setSelectedMeter(metersData[0].id);
        } else {
          setError('No meters found for your account. Please contact customer support.');
        }
      } else {
        throw new Error(response.data?.message || 'Failed to fetch meters data');
      }
    } catch (error: any) {
      console.error('Error fetching meters:', error);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load meters. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Fallback data for development/testing
      const fallbackMeters = [
        {
          id: 'meter-001',
          meter_number: 'WM-001234',
          location: 'Main House',
          credit_balance: 75000,
          status: 'active'
        },
        {
          id: 'meter-002',
          meter_number: 'WM-005678',
          location: 'Garden',
          credit_balance: 25000,
          status: 'active'
        }
      ];
      
      setMeters(fallbackMeters);
      setSelectedMeter(fallbackMeters[0].id);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setAmount(value);
    } else {
      setAmount(0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMeter) {
      toast.error('Please select a meter');
      return;
    }
    
    if (amount < 10000) {
      toast.error('Minimum top-up amount is Rp 10,000');
      return;
    }
    
    setPaymentStep(2);
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
  };

  const processPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Create payment request
      const paymentData = {
        meter_id: selectedMeter,
        amount: amount,
        payment_method: selectedPaymentMethod
      };
      
      // Call the payment API
      const response = await paymentAPI.createTopupPayment(paymentData);
      
      if (response.data && response.data.status === 'success') {
        const paymentResult = response.data.data;
        
        // Set transaction ID from response
        setTransactionId(paymentResult.transaction_id || 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase());
        
        // If payment gateway requires redirect
        if (paymentResult.redirect_url) {
          // Open payment gateway in new window
          window.open(paymentResult.redirect_url, '_blank');
          
          // Show waiting message
          toast.info('Please complete your payment in the opened window');
          
          // Poll for payment status
          const checkPaymentStatus = async () => {
            try {
              const statusResponse = await paymentAPI.checkPaymentStatus(paymentResult.transaction_id);
              
              if (statusResponse.data && statusResponse.data.status === 'success') {
                const status = statusResponse.data.data.status;
                
                if (status === 'completed' || status === 'success') {
                  // Payment successful
                  setPaymentSuccess(true);
                  setPaymentStep(3);
                  
                  // Refresh meters to get updated balance
                  await fetchMeters();
                  
                  toast.success('Payment successful! Credit has been added to your meter.');
                  setLoading(false);
                  return;
                } else if (status === 'failed' || status === 'expired') {
                  // Payment failed
                  const errorMsg = 'Payment failed or expired. Please try again.';
                  setError(errorMsg);
                  toast.error(errorMsg);
                  setLoading(false);
                  return;
                } else if (status === 'pending') {
                  // Payment still pending
                  toast.info('Payment is still being processed. Please wait...');
                  
                  // If still pending, check again after 5 seconds
                  setTimeout(checkPaymentStatus, 5000);
                }
              } else {
                throw new Error('Invalid payment status response');
              }
            } catch (error: any) {
              console.error('Error checking payment status:', error);
              const errorMsg = error.response?.data?.message || error.message || 'Error checking payment status';
              setError(errorMsg);
              toast.error(errorMsg);
              setLoading(false);
            }
          };
          
          // Start polling
          setTimeout(checkPaymentStatus, 5000);
        } else {
          // Direct payment (no redirect needed)
          setPaymentSuccess(true);
          setPaymentStep(3);
          
          // Update meter balance
          setMeters(meters.map(meter => 
            meter.id === selectedMeter 
              ? { ...meter, credit_balance: meter.credit_balance + amount } 
              : meter
          ));
          
          toast.success('Payment successful! Credit has been added to your meter.');
          setLoading(false);
        }
      } else {
        throw new Error(response.data?.message || 'Payment processing failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
      setError(errorMsg);
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const resetPayment = () => {
    setPaymentStep(1);
    setSelectedPaymentMethod('');
    setPaymentSuccess(false);
    setTransactionId('');
    setError(null);
    fetchMeters(); // Refresh meters data
  };

  const getSelectedMeter = () => {
    return meters.find(meter => meter.id === selectedMeter);
  };

  const renderPaymentStep = () => {
    switch (paymentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label htmlFor="meter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Meter
              </label>
              <select
                id="meter"
                name="meter"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={selectedMeter}
                onChange={(e) => setSelectedMeter(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a meter</option>
                {meters.map((meter) => (
                  <option key={meter.id} value={meter.id}>
                    {meter.meter_number} - {meter.location} (Balance: Rp {meter.credit_balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Top-up Amount
              </label>
              <div className="mt-1">
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Rp</span>
                  </div>
                  <input
                    type="text"
                    name="amount"
                    id="amount"
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-12 pr-12 sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="0"
                    value={amount}
                    onChange={handleAmountChange}
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-4 gap-2">
                {predefinedAmounts.map((presetAmount) => (
                  <button
                    key={presetAmount}
                    type="button"
                    className={`py-2 px-4 border ${
                      amount === presetAmount
                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'border-gray-300 bg-white text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                    } rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    onClick={() => setAmount(presetAmount)}
                  >
                    Rp {presetAmount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => navigate('/dashboard/customer')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={!selectedMeter || amount < 10000 || loading}
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Payment Summary</h3>
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                    <p>Meter: {getSelectedMeter()?.meter_number} - {getSelectedMeter()?.location}</p>
                    <p>Amount: Rp {amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`border rounded-md p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                    }`}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                  >
                    <div className="flex items-center">
                      <div className={`rounded-full p-2 ${
                        selectedPaymentMethod === method.id
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        <method.icon className="h-6 w-6" />
                      </div>
                      <div className="ml-3">
                        <p className={`text-sm font-medium ${
                          selectedPaymentMethod === method.id
                            ? 'text-blue-700 dark:text-blue-300'
                            : 'text-gray-900 dark:text-gray-300'
                        }`}>
                          {method.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                  onClick={() => setPaymentStep(1)}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={processPayment}
                  disabled={!selectedPaymentMethod || loading}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Pay Now'
                  )}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Payment Successful</h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your payment of Rp {amount.toLocaleString()} has been processed successfully.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Transaction ID: {transactionId}
              </p>
            </div>
            <div className="mt-6 bg-green-50 dark:bg-green-900/20 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3 text-left">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Credit Added</h3>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                    <p>Meter: {getSelectedMeter()?.meter_number} - {getSelectedMeter()?.location}</p>
                    <p>Previous Balance: Rp {((getSelectedMeter()?.credit_balance || 0) - amount).toLocaleString()}</p>
                    <p>New Balance: Rp {(getSelectedMeter()?.credit_balance || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                type="button"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => navigate('/dashboard/customer')}
              >
                Return to Dashboard
              </button>
              <button
                type="button"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                onClick={resetPayment}
              >
                Make Another Payment
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Top Up Credit
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Add credit to your water meter to continue your service
          </p>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit}>
            {renderPaymentStep()}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Topup;
