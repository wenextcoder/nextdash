import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User as UserIcon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import type { User } from '@/types'

export default function AccountDetails() {
  const [editing, setEditing] = useState(false)
  const [changePassword, setChangePassword] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['account'],
    queryFn: api.getAccount,
  })

  const updateMutation = useMutation({
    mutationFn: api.updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account'] })
      setEditing(false)
      setChangePassword(false)
      toast({
        title: 'Success',
        description: 'Account updated successfully',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update account',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data: any = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      display_name: formData.get('display_name'),
      email: formData.get('email'),
    }

    if (changePassword) {
      const currentPassword = formData.get('current_password') as string
      const password = formData.get('password') as string
      const confirmPassword = formData.get('confirm_password') as string

      if (!currentPassword) {
        toast({
          title: 'Error',
          description: 'Current password is required',
          variant: 'destructive',
        })
        return
      }

      if (password !== confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match',
          variant: 'destructive',
        })
        return
      }

      if (password && password.length < 8) {
        toast({
          title: 'Error',
          description: 'Password must be at least 8 characters long',
          variant: 'destructive',
        })
        return
      }

      if (password) {
        data.password = password
        data.current_password = currentPassword
      }
    }

    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Details</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account information and password
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your personal details and email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    defaultValue={user?.first_name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    defaultValue={user?.last_name}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  name="display_name"
                  defaultValue={user?.display_name}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user?.email}
                  required
                />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <Label>Change Password</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setChangePassword(!changePassword)}
                  >
                    {changePassword ? 'Cancel' : 'Change Password'}
                  </Button>
                </div>

                {changePassword && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="current_password">Current Password *</Label>
                      <Input
                        id="current_password"
                        name="current_password"
                        type="password"
                        placeholder="Enter your current password"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        You must enter your current password to change it
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="password">New Password *</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter new password (min 8 characters)"
                        required
                        minLength={8}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm_password">Confirm New Password *</Label>
                      <Input
                        id="confirm_password"
                        name="confirm_password"
                        type="password"
                        placeholder="Confirm new password"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false)
                    setChangePassword(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Username</div>
                  <div className="text-base">{user?.username}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Display Name</div>
                  <div className="text-base">{user?.display_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">First Name</div>
                  <div className="text-base">{user?.first_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Last Name</div>
                  <div className="text-base">{user?.last_name || '-'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="text-base">{user?.email}</div>
                </div>
              </div>
              <Button onClick={() => setEditing(true)}>Edit Account</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

