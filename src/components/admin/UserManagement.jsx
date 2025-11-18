import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const UserManagement = () => {
  return (
    <div className="space-y-6" data-testid="user-management">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-2">Manage system users and permissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">User management interface coming soon</p>
          <p className="text-sm text-gray-400 mt-2">Manage admins, pharmacists, and suppliers</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
