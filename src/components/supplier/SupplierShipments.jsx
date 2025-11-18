import React from 'react';
import { Truck } from 'lucide-react';
import { Card, CardContent } from '../ui/card';

const SupplierShipments = () => {
  return (
    <div className="space-y-6" data-testid="supplier-shipments">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
        <p className="text-gray-600 mt-2">Track and manage your shipments</p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <Truck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No shipments to display</p>
          <p className="text-sm text-gray-400 mt-2">Shipments will appear here once orders are processed</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierShipments;
