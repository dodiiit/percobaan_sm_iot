<?php

declare(strict_types=1);

use DI\ContainerBuilder;
use Psr\Container\ContainerInterface;
use IndoWater\Api\Repositories\UserRepository;
use IndoWater\Api\Repositories\ClientRepository;
use IndoWater\Api\Repositories\CustomerRepository;
use IndoWater\Api\Repositories\PropertyRepository;
use IndoWater\Api\Repositories\MeterRepository;
use IndoWater\Api\Repositories\PaymentRepository;
use IndoWater\Api\Repositories\CreditRepository;
use IndoWater\Api\Repositories\NotificationRepository;
use IndoWater\Api\Repositories\SettingRepository;
use IndoWater\Api\Repositories\ReportRepository;

return function (ContainerBuilder $containerBuilder) {
    $containerBuilder->addDefinitions([
        // Repositories
        UserRepository::class => function (ContainerInterface $c) {
            return new UserRepository($c->get(\PDO::class));
        },
        ClientRepository::class => function (ContainerInterface $c) {
            return new ClientRepository($c->get(\PDO::class));
        },
        CustomerRepository::class => function (ContainerInterface $c) {
            return new CustomerRepository($c->get(\PDO::class));
        },
        PropertyRepository::class => function (ContainerInterface $c) {
            return new PropertyRepository($c->get(\PDO::class));
        },
        MeterRepository::class => function (ContainerInterface $c) {
            return new MeterRepository($c->get(\PDO::class));
        },
        PaymentRepository::class => function (ContainerInterface $c) {
            return new PaymentRepository($c->get(\PDO::class));
        },
        CreditRepository::class => function (ContainerInterface $c) {
            return new CreditRepository($c->get(\PDO::class));
        },
        NotificationRepository::class => function (ContainerInterface $c) {
            return new NotificationRepository($c->get(\PDO::class));
        },
        SettingRepository::class => function (ContainerInterface $c) {
            return new SettingRepository($c->get(\PDO::class));
        },
        ReportRepository::class => function (ContainerInterface $c) {
            return new ReportRepository($c->get(\PDO::class));
        },
    ]);
};