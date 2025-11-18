import React, { useState, useEffect } from 'react';
import { Upload, FileText, Check, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import api from '../../utils/api';
import { toast } from 'sonner';

const PrescriptionManagement = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationResult, setValidationResult] = useState(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await api.get('/prescriptions');
      setPrescriptions(response.data);
    } catch (error) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/prescriptions/validate-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setValidationResult(response.data);
      setShowValidationDialog(true);
      toast.success('Prescription validated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to validate prescription');
    } finally {
      setUploading(false);
    }
  };

  const handleValidate = async (prescriptionId, status, notes = '') => {
    try {
      await api.patch(`/prescriptions/${prescriptionId}/validate`, {
        status,
        notes
      });
      toast.success(`Prescription ${status}`);
      fetchPrescriptions();
    } catch (error) {
      toast.error('Failed to update prescription');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      validated: 'bg-green-100 text-green-800',
      dispensed: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6" data-testid="prescription-management">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Management</h1>
          <p className="text-gray-600 mt-2">Upload and validate prescriptions with AI</p>
        </div>
        <div>
          <input
            type="file"
            id="prescription-upload"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label htmlFor="prescription-upload">
            <Button
              as="span"
              className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
              disabled={uploading}
              data-testid="upload-prescription-button"
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Prescription'}
            </Button>
          </label>
        </div>
      </div>

      {/* AI Validation Result Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Validation Result</DialogTitle>
            <DialogDescription>Review the AI-extracted prescription details</DialogDescription>
          </DialogHeader>
          {validationResult && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 text-blue-900">Validation Status</h3>
                <p className="text-sm text-blue-800">
                  {validationResult.success ? '✓ Successfully validated' : '✗ Validation failed'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <pre className="text-sm whitespace-pre-wrap text-gray-700">
                  {validationResult.validation_result}
                </pre>
              </div>
              <Button
                onClick={() => setShowValidationDialog(false)}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Prescriptions List */}
      <div className="grid grid-cols-1 gap-4">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id} data-testid="prescription-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Patient: {prescription.patient_name}
                </CardTitle>
                <Badge className={getStatusColor(prescription.status)}>
                  {prescription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Patient ID:</span>
                    <span className="ml-2 font-medium">{prescription.patient_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Doctor:</span>
                    <span className="ml-2 font-medium">{prescription.doctor_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(prescription.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {prescription.validated_by && (
                    <div>
                      <span className="text-gray-600">Validated By:</span>
                      <span className="ml-2 font-medium">{prescription.validated_by}</span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Medicines:</h4>
                  <div className="space-y-2">
                    {prescription.medicines.map((med, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">{med.medicine_name || med.name}</p>
                        <p className="text-sm text-gray-600">
                          Quantity: {med.quantity} | Dosage: {med.dosage || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {prescription.ai_validation_result && (
                  <div className="bg-blue-50 p-3 rounded">
                    <h4 className="font-semibold mb-1 text-blue-900">AI Validation:</h4>
                    <p className="text-sm text-blue-800">{prescription.ai_validation_result}</p>
                  </div>
                )}

                {prescription.notes && (
                  <div className="bg-gray-50 p-3 rounded">
                    <h4 className="font-semibold mb-1">Notes:</h4>
                    <p className="text-sm text-gray-600">{prescription.notes}</p>
                  </div>
                )}

                {prescription.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleValidate(prescription.id, 'validated')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid="approve-prescription-button"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleValidate(prescription.id, 'rejected', 'Invalid prescription')}
                      variant="destructive"
                      className="flex-1"
                      data-testid="reject-prescription-button"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {prescriptions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No prescriptions yet. Upload one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionManagement;
