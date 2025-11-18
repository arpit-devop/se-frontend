import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import api from '../../utils/api';
import { toast } from 'sonner';

const InventoryManagement = () => {
  const [medicines, setMedicines] = useState([]);
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: '',
    manufacturer: '',
    quantity: 0,
    unit: '',
    reorder_level: 0,
    unit_price: 0,
    batch_number: '',
    expiry_date: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, []);

  useEffect(() => {
    const filtered = medicines.filter(med =>
      med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.generic_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedicines(filtered);
  }, [searchTerm, medicines]);

  const fetchMedicines = async () => {
    try {
      const response = await api.get('/medicines');
      setMedicines(response.data);
      setFilteredMedicines(response.data);
    } catch (error) {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/medicines', formData);
      toast.success('Medicine added successfully');
      setShowAddDialog(false);
      fetchMedicines();
      resetForm();
    } catch (error) {
      toast.error('Failed to add medicine');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success('Medicine deleted');
      fetchMedicines();
    } catch (error) {
      toast.error('Failed to delete medicine');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      generic_name: '',
      category: '',
      manufacturer: '',
      quantity: 0,
      unit: '',
      reorder_level: 0,
      unit_price: 0,
      batch_number: '',
      expiry_date: '',
      location: '',
      description: ''
    });
  };

  const getStockStatus = (quantity, reorderLevel) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'destructive' };
    if (quantity <= reorderLevel) return { label: 'Low Stock', color: 'warning' };
    return { label: 'In Stock', color: 'success' };
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="inventory-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-2">Manage your medicine stock</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700" data-testid="add-medicine-button">
              <Plus className="h-4 w-4 mr-2" />
              Add Medicine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Medicine</DialogTitle>
              <DialogDescription>Enter medicine details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Medicine Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Generic Name</Label>
                  <Input
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Manufacturer</Label>
                  <Input
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="tablets, ml, etc."
                    required
                  />
                </div>
                <div>
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Unit Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label>Batch Number</Label>
                  <Input
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Shelf A1, etc."
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Add Medicine
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search medicines..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="search-medicine-input"
        />
      </div>

      {/* Medicine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMedicines.map((medicine) => {
          const status = getStockStatus(medicine.quantity, medicine.reorder_level);
          return (
            <Card key={medicine.id} data-testid="medicine-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{medicine.name}</h3>
                    <p className="text-sm text-gray-600">{medicine.generic_name}</p>
                  </div>
                  <Badge className={`bg-${status.color === 'success' ? 'green' : status.color === 'warning' ? 'orange' : 'red'}-100 text-${status.color === 'success' ? 'green' : status.color === 'warning' ? 'orange' : 'red'}-800`}>
                    {status.label}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{medicine.quantity} {medicine.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{medicine.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Batch:</span>
                    <span className="font-medium">{medicine.batch_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiry:</span>
                    <span className="font-medium">{new Date(medicine.expiry_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{medicine.location}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(medicine.id)}
                    className="flex-1"
                    data-testid="delete-medicine-button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMedicines.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No medicines found
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
