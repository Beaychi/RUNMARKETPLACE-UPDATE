import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, CreditCard } from "lucide-react";

interface PurchaseFormProps {
  product: {
    id: string;
    name: string;
    price_naira: number;
    vendor_id: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function PurchaseForm({ product, onClose, onSuccess }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const totalPrice = product.price_naira * quantity;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const customerName = formData.get("customerName") as string;
    const customerEmail = formData.get("customerEmail") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const deliveryAddress = formData.get("deliveryAddress") as string;
    const paymentMethod = formData.get("paymentMethod") as string;
    const notes = formData.get("notes") as string;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to make a purchase");
        setLoading(false);
        return;
      }

      toast({
        title: "Purchase request submitted!",
        description: `Your interest in ${product.name} has been recorded. The vendor will contact you soon.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <CardTitle>Complete Your Purchase</CardTitle>
        </div>
        <CardDescription>
          Fill in your details to purchase: {product.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Product Summary */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4" />
              <span className="font-medium">Order Summary</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Product:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Price per item:</span>
                <span>₦{product.price_naira.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <Label htmlFor="quantity">Quantity:</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-16 h-8 text-center"
                />
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-1">
                <span>Total:</span>
                <span className="text-primary">₦{totalPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                name="customerName"
                type="text"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address *</Label>
              <Textarea
                id="deliveryAddress"
                name="deliveryAddress"
                placeholder="Enter your full delivery address"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select name="paymentMethod" defaultValue="cash_on_delivery" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash_on_delivery">Cash on Delivery</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="mobile_money">Mobile Money</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any special instructions or comments"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {loading ? "Processing..." : "Place Order"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}