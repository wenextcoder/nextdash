import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api'
import type { Address } from '@/types'

export default function Addresses() {
  const [editingBilling, setEditingBilling] = useState(false)
  const [editingShipping, setEditingShipping] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: api.getAddresses,
  })

  const updateMutation = useMutation({
    mutationFn: ({ type, address }: { type: 'billing' | 'shipping'; address: Address }) =>
      api.updateAddress(type, address),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      if (variables.type === 'billing') {
        setEditingBilling(false)
      } else {
        setEditingShipping(false)
      }
      toast({
        title: 'Success',
        description: 'Address updated successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update address',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (type: 'billing' | 'shipping', e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const address: Address = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      company: formData.get('company') as string,
      address_1: formData.get('address_1') as string,
      address_2: formData.get('address_2') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postcode: formData.get('postcode') as string,
      country: formData.get('country') as string,
    }

    if (type === 'billing') {
      address.email = formData.get('email') as string
      address.phone = formData.get('phone') as string
    }

    updateMutation.mutate({ type, address })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const AddressForm = ({ 
    type, 
    address, 
    editing, 
    onEdit, 
    onCancel 
  }: { 
    type: 'billing' | 'shipping'
    address: Address
    editing: boolean
    onEdit: () => void
    onCancel: () => void
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {type === 'billing' ? 'Billing Address' : 'Shipping Address'}
        </CardTitle>
        <CardDescription>
          {type === 'billing' 
            ? 'The address used for billing and invoicing'
            : 'Where your orders will be shipped'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {editing ? (
          <form onSubmit={(e) => handleSubmit(type, e)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${type}_first_name`}>First Name *</Label>
                <Input
                  id={`${type}_first_name`}
                  name="first_name"
                  defaultValue={address.first_name}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`${type}_last_name`}>Last Name *</Label>
                <Input
                  id={`${type}_last_name`}
                  name="last_name"
                  defaultValue={address.last_name}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor={`${type}_company`}>Company</Label>
              <Input
                id={`${type}_company`}
                name="company"
                defaultValue={address.company}
              />
            </div>

            <div>
              <Label htmlFor={`${type}_address_1`}>Address Line 1 *</Label>
              <Input
                id={`${type}_address_1`}
                name="address_1"
                defaultValue={address.address_1}
                required
              />
            </div>

            <div>
              <Label htmlFor={`${type}_address_2`}>Address Line 2</Label>
              <Input
                id={`${type}_address_2`}
                name="address_2"
                defaultValue={address.address_2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${type}_city`}>City *</Label>
                <Input
                  id={`${type}_city`}
                  name="city"
                  defaultValue={address.city}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`${type}_state`}>State *</Label>
                <Input
                  id={`${type}_state`}
                  name="state"
                  defaultValue={address.state}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`${type}_postcode`}>Postcode *</Label>
                <Input
                  id={`${type}_postcode`}
                  name="postcode"
                  defaultValue={address.postcode}
                  required
                />
              </div>
              <div>
                <Label htmlFor={`${type}_country`}>Country *</Label>
                <Input
                  id={`${type}_country`}
                  name="country"
                  defaultValue={address.country}
                  required
                />
              </div>
            </div>

            {type === 'billing' && (
              <>
                <div>
                  <Label htmlFor="billing_email">Email *</Label>
                  <Input
                    id="billing_email"
                    name="email"
                    type="email"
                    defaultValue={address.email}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billing_phone">Phone</Label>
                  <Input
                    id="billing_phone"
                    name="phone"
                    type="tel"
                    defaultValue={address.phone}
                  />
                </div>
              </>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Address'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="space-y-1 text-sm mb-4">
              <div className="font-medium">
                {address.first_name} {address.last_name}
              </div>
              {address.company && <div>{address.company}</div>}
              <div>{address.address_1}</div>
              {address.address_2 && <div>{address.address_2}</div>}
              <div>
                {address.city}, {address.state} {address.postcode}
              </div>
              <div>{address.country}</div>
              {type === 'billing' && (
                <div className="pt-2 border-t mt-2">
                  <div>{address.email}</div>
                  {address.phone && <div>{address.phone}</div>}
                </div>
              )}
            </div>
            <Button onClick={onEdit}>Edit Address</Button>
          </>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Addresses</h1>
        <p className="text-muted-foreground mt-1">
          Manage your billing and shipping addresses
        </p>
      </div>

      {/* Addresses */}
      <Tabs defaultValue="billing" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="billing">Billing Address</TabsTrigger>
          <TabsTrigger value="shipping">Shipping Address</TabsTrigger>
        </TabsList>
        
        <TabsContent value="billing" className="mt-6">
          {data?.billing && (
            <AddressForm
              type="billing"
              address={data.billing}
              editing={editingBilling}
              onEdit={() => setEditingBilling(true)}
              onCancel={() => setEditingBilling(false)}
            />
          )}
        </TabsContent>
        
        <TabsContent value="shipping" className="mt-6">
          {data?.shipping && (
            <AddressForm
              type="shipping"
              address={data.shipping}
              editing={editingShipping}
              onEdit={() => setEditingShipping(true)}
              onCancel={() => setEditingShipping(false)}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

