'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { createClient } from '@/lib/supabase';
import { createStaffUser, checkUserPermission } from '@/lib/auth';
import { User, UserRole } from '@/lib/types';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  ChefHat, 
  Wine, 
  UserCheck,
  ArrowLeft,
  Mail,
  Shield
} from 'lucide-react';

export default function StaffPage() {
  const { user, restaurant, isAuthenticated } = useAppStore();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: '',
    name: '',
    role: 'WAITSTAFF' as UserRole,
  });
  const [createdStaffCredentials, setCreatedStaffCredentials] = useState<{
    email: string;
    temp_password: string;
    login_url: string;
  } | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    
    // Check if user has permission to manage staff (owners only)
    if (!checkUserPermission(user.role, 'OWNER')) {
      router.push('/login');
      return;
    }
    
    fetchStaff();
  }, [isAuthenticated, user, router]);

  const fetchStaff = async () => {
    if (!restaurant) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setStaff(data || []);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant || !newStaff.email.trim() || !newStaff.name.trim()) return;
    
    try {
      setAddingStaff(true);
      
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', newStaff.email.trim())
        .single();
      
      if (existingUser) {
        alert('A user with this email already exists.');
        return;
      }
      
      // Create staff user (this will create both auth user and profile)
      const staffUser = await createStaffUser(
        newStaff.email.trim(),
        newStaff.name.trim(),
        newStaff.role,
        restaurant.id
      );
      
      setStaff([staffUser, ...staff]);
      setNewStaff({ email: '', name: '', role: 'WAITSTAFF' });
      setShowAddStaff(false);
      
      // Store credentials for display
      setCreatedStaffCredentials({
        email: staffUser.email,
        temp_password: staffUser.temp_password,
        login_url: staffUser.login_url
      });
    } catch (error: any) {
      console.error('Error adding staff:', error);
      alert(`Failed to create staff member: ${error.message}`);
    } finally {
      setAddingStaff(false);
    }
  };

  const deleteStaff = async (staffId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from your staff? This cannot be undone.`)) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId);
      
      if (error) throw error;
      
      setStaff(staff.filter(s => s.id !== staffId));
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to remove staff member. Please try again.');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN':
        return <ChefHat className="h-5 w-5" />;
      case 'BARTENDER':
        return <Wine className="h-5 w-5" />;
      case 'WAITSTAFF':
        return <UserCheck className="h-5 w-5" />;
      case 'OWNER':
        return <Shield className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'KITCHEN':
        return 'bg-red-100 text-red-800';
      case 'BARTENDER':
        return 'bg-purple-100 text-purple-800';
      case 'WAITSTAFF':
        return 'bg-blue-100 text-blue-800';
      case 'OWNER':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-white text-black';
    }
  };

  const getStaffByRole = (role: UserRole) => {
    return staff.filter(s => s.role === role);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-black"></div>
          <p className="mt-4 text-black">Loading staff...</p>
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
                <h1 className="text-2xl font-bold text-black">Staff Management</h1>
                <p className="text-sm text-black">{restaurant?.name}</p>
              </div>
            </div>
            <Button
              onClick={() => setShowAddStaff(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add Staff Form */}
        {showAddStaff && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Add New Staff Member</h2>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  required
                  fullWidth
                  placeholder="John Doe"
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                  required
                  fullWidth
                  placeholder="staff@example.com"
                />
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Role
                  </label>
                  <select
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="WAITSTAFF">Wait Staff</option>
                    <option value="KITCHEN">Kitchen Staff</option>
                    <option value="BARTENDER">Bartender</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  loading={addingStaff}
                  disabled={!newStaff.email.trim() || !newStaff.name.trim()}
                >
                  Add Staff Member
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddStaff(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The staff member will be created with a temporary password. 
                They will need to contact you to get their login credentials and change their password on first login.
              </p>
            </div>
          </Card>
        )}

        {/* Staff Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-black">Owners</h3>
            <p className="text-2xl font-bold text-black">{getStaffByRole('OWNER').length}</p>
          </Card>
          
          <Card className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-black">Wait Staff</h3>
            <p className="text-2xl font-bold text-black">{getStaffByRole('WAITSTAFF').length}</p>
          </Card>
          
          <Card className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ChefHat className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-black">Kitchen Staff</h3>
            <p className="text-2xl font-bold text-black">{getStaffByRole('KITCHEN').length}</p>
          </Card>
          
          <Card className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Wine className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-black">Bartenders</h3>
            <p className="text-2xl font-bold text-black">{getStaffByRole('BARTENDER').length}</p>
          </Card>
        </div>

        {/* Staff List */}
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">All Staff Members</h2>
            <p className="text-sm text-black">
              {staff.length} total staff members
            </p>
          </div>
          
          {staff.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-24 w-24 text-black mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No Staff Members Yet</h3>
              <p className="text-black mb-4">
                Add your first staff member to get started with team management
              </p>
              <Button onClick={() => setShowAddStaff(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Staff Member
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {staff.map((staffMember) => (
                <div
                  key={staffMember.id}
                  className="flex items-center justify-between p-4 border border-black rounded-lg hover:bg-white"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRoleColor(staffMember.role)}`}>
                      {getRoleIcon(staffMember.role)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-black">{staffMember.name || staffMember.email}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(staffMember.role)}`}>
                          {staffMember.role.charAt(0) + staffMember.role.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <p className="text-sm text-black">
                        {staffMember.email} • Added {new Date(staffMember.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {staffMember.role !== 'OWNER' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            alert('Edit functionality coming soon!');
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteStaff(staffMember.id, staffMember.email)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {staffMember.role === 'OWNER' && (
                      <span className="text-sm text-black italic">Restaurant Owner</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Staff Login Instructions */}
        <Card className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Staff Login Instructions</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-medium text-black mb-2">For Kitchen Staff:</h3>
              <p className="text-sm text-black">
                Login at <strong>{window.location.origin}/login</strong> and navigate to the Kitchen interface to manage orders.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-medium text-black mb-2">For Wait Staff:</h3>
              <p className="text-sm text-black">
                Login at <strong>{window.location.origin}/login</strong> and access the Wait Staff interface to manage tables and orders.
              </p>
            </div>
            
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-medium text-black mb-2">For Bartenders:</h3>
              <p className="text-sm text-black">
                Login at <strong>{window.location.origin}/login</strong> and use the Bar interface to manage drink orders and tabs.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Staff Credentials Modal */}
      {createdStaffCredentials && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-foreground">Staff Member Created</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatedStaffCredentials(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={createdStaffCredentials.email}
                    readOnly
                    fullWidth
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(createdStaffCredentials.email)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Temporary Password:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={createdStaffCredentials.temp_password}
                    readOnly
                    fullWidth
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(createdStaffCredentials.temp_password)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Login URL:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={createdStaffCredentials.login_url}
                    readOnly
                    fullWidth
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(createdStaffCredentials.login_url)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-warning-foreground">
                  <strong>Important:</strong> Share these credentials with the staff member. 
                  They should change their password on first login.
                </p>
              </div>
              
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    const credentials = `Email: ${createdStaffCredentials.email}\nPassword: ${createdStaffCredentials.temp_password}\nLogin: ${createdStaffCredentials.login_url}`;
                    navigator.clipboard.writeText(credentials);
                  }}
                  fullWidth
                >
                  Copy All Credentials
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setCreatedStaffCredentials(null)}
                  fullWidth
                >
                  Done
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}