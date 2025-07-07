'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { Table } from '@/lib/types';
import { generateQRCodeForTable } from '@/lib/qr';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { 
  QrCode, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  Power,
  PowerOff,
  ArrowLeft,
  Printer
} from 'lucide-react';

export default function TablesPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [selectedQR, setSelectedQR] = useState<{ table: Table; qrCode: string } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'OWNER') {
      router.push('/login');
      return;
    }
    
    fetchTables();
  }, [isAuthenticated, user, router]);

  const fetchTables = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('name');
      
      if (error) throw error;
      
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newTableName.trim()) return;
    
    try {
      // Create table record first
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .insert({
          name: newTableName.trim(),
          restaurant_id: restaurant.id,
          token: '', // Will be updated after QR generation
          active: true,
        })
        .select()
        .single();
      
      if (tableError) throw tableError;
      
      // Generate QR code and token
      const { token, qrCodeDataURL } = await generateQRCodeForTable(
        tableData.id,
        restaurant.id,
        tableData.name
      );
      
      // Update table with token and QR code URL
      const { data: updatedTable, error: updateError } = await supabase
        .from('tables')
        .update({
          token: token,
          qr_code_url: qrCodeDataURL,
        })
        .eq('id', tableData.id)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      setTables([...tables, updatedTable]);
      setNewTableName('');
      setShowAddTable(false);
    } catch (error) {
      console.error('Error adding table:', error);
    }
  };

  const regenerateQRCode = async (table: Table) => {
    try {
      setGeneratingQR(table.id);
      
      const { token, qrCodeDataURL } = await generateQRCodeForTable(
        table.id,
        table.restaurant_id,
        table.name
      );
      
      const { data: updatedTable, error } = await supabase
        .from('tables')
        .update({
          token: token,
          qr_code_url: qrCodeDataURL,
        })
        .eq('id', table.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setTables(tables.map(t => t.id === table.id ? updatedTable : t));
    } catch (error) {
      console.error('Error regenerating QR code:', error);
    } finally {
      setGeneratingQR(null);
    }
  };

  const toggleTableStatus = async (table: Table) => {
    try {
      const { data: updatedTable, error } = await supabase
        .from('tables')
        .update({ active: !table.active })
        .eq('id', table.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setTables(tables.map(t => t.id === table.id ? updatedTable : t));
    } catch (error) {
      console.error('Error updating table status:', error);
    }
  };

  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table? This cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);
      
      if (error) throw error;
      
      setTables(tables.filter(t => t.id !== tableId));
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };

  const downloadQRCode = (table: Table) => {
    if (!table.qr_code_url) return;
    
    const link = document.createElement('a');
    link.href = table.qr_code_url;
    link.download = `table-${table.name}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = (table: Table) => {
    if (!table.qr_code_url) return;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - Table ${table.name}</title>
            <style>
              body { 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                min-height: 100vh; 
                margin: 0; 
                font-family: Arial, sans-serif;
              }
              .qr-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #000;
                margin: 20px;
              }
              .restaurant-name {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
              }
              .table-name {
                font-size: 18px;
                margin-bottom: 20px;
                color: #666;
              }
              .qr-code {
                margin: 20px 0;
              }
              .instructions {
                font-size: 14px;
                margin-top: 20px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="restaurant-name">${restaurant?.name}</div>
              <div class="table-name">Table: ${table.name}</div>
              <div class="qr-code">
                <img src="${table.qr_code_url}" alt="QR Code" style="width: 200px; height: 200px;" />
              </div>
              <div class="instructions">
                Scan this QR code to view our menu and place your order
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
          <p className="mt-4 text-black">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-black">Table Management</h1>
                <p className="text-sm text-black">{restaurant?.name}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddTable(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Table Form */}
        {showAddTable && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Table</h2>
            <form onSubmit={handleAddTable} className="flex gap-4">
              <Input
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                placeholder="Table name (e.g., 'Window Table', 'Booth 5')"
                fullWidth
                required
              />
              <Button type="submit">Add Table</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAddTable(false)}
              >
                Cancel
              </Button>
            </form>
          </Card>
        )}

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="text-center py-12">
            <QrCode className="h-24 w-24 text-black mx-auto mb-4" />
            <h3 className="text-lg font-medium text-black mb-2">No Tables Yet</h3>
            <p className="text-black mb-4">
              Create your first table to generate QR codes for customer ordering
            </p>
            <Button onClick={() => setShowAddTable(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <Card key={table.id}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-black">{table.name}</h3>
                    <p className="text-sm text-black">
                      Created {new Date(table.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    table.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {table.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                {table.qr_code_url && (
                  <div className="mb-4 text-center">
                    <img
                      src={table.qr_code_url}
                      alt={`QR Code for ${table.name}`}
                      className="w-32 h-32 mx-auto border border-black rounded"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedQR({ table, qrCode: table.qr_code_url || '' })}
                      disabled={!table.qr_code_url}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadQRCode(table)}
                      disabled={!table.qr_code_url}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => printQRCode(table)}
                      disabled={!table.qr_code_url}
                    >
                      <Printer className="h-4 w-4 mr-1" />
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => regenerateQRCode(table)}
                      loading={generatingQR === table.id}
                    >
                      <QrCode className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant={table.active ? "danger" : "success"}
                      onClick={() => toggleTableStatus(table)}
                    >
                      {table.active ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => deleteTable(table.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">
                QR Code - {selectedQR.table.name}
              </h2>
              <img
                src={selectedQR.qrCode}
                alt={`QR Code for ${selectedQR.table.name}`}
                className="w-64 h-64 mx-auto border border-black rounded mb-4"
              />
              <p className="text-sm text-black mb-6">
                Customers can scan this QR code to access your menu and place orders
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="ghost"
                  onClick={() => downloadQRCode(selectedQR.table)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => printQRCode(selectedQR.table)}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  onClick={() => setSelectedQR(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}