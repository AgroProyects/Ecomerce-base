import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Package, Truck, PackageCheck, XCircle, RotateCcw, DollarSign } from 'lucide-react';
import type { OrderStatus } from '@/schemas/order.schema';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  }
> = {
  pending: {
    label: 'Pendiente',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  pending_payment: {
    label: 'Esperando Pago',
    variant: 'secondary',
    icon: DollarSign,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  paid: {
    label: 'Pagado',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  processing: {
    label: 'Procesando',
    variant: 'secondary',
    icon: Package,
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  shipped: {
    label: 'Enviado',
    variant: 'default',
    icon: Truck,
    className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  delivered: {
    label: 'Entregado',
    variant: 'default',
    icon: PackageCheck,
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Cancelado',
    variant: 'destructive',
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  refunded: {
    label: 'Reembolsado',
    variant: 'secondary',
    icon: RotateCcw,
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ''}`}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export function getStatusLabel(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.label || status;
}

export function getStatusColor(status: OrderStatus): string {
  return STATUS_CONFIG[status]?.className || '';
}
