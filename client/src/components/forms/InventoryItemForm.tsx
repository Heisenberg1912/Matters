import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { inventoryItemSchema, type InventoryItemFormData } from "@/lib/validations";
import { useInventoryStore } from "@/store";
import { useNotifications } from "@/hooks/use-notifications";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { InventoryItem } from "@/store/types";

interface InventoryItemFormProps {
  item?: InventoryItem;
  open: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  "Cement & Concrete",
  "Steel & Metal",
  "Timber & Wood",
  "Electrical",
  "Plumbing",
  "Finishing",
  "Tools & Equipment",
  "Safety Equipment"
];

const UNITS = ["bags", "kg", "tons", "pcs", "meters", "sqft", "cubic meters", "liters"];

const LOCATIONS = ["Main Site", "Warehouse A", "Warehouse B", "Office Store"];

export function InventoryItemForm({ item, open, onClose }: InventoryItemFormProps) {
  const addItem = useInventoryStore((state) => state.addItem);
  const updateItem = useInventoryStore((state) => state.updateItem);
  const { showToast } = useNotifications();

  const form = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          cost: item.cost,
          location: item.location,
          minStock: item.minStock,
        }
      : {
          name: "",
          category: "",
          quantity: 0,
          unit: "",
          cost: 0,
          location: "",
          minStock: 10,
        },
  });

  const onSubmit = (data: InventoryItemFormData) => {
    try {
      if (item) {
        updateItem(item.id, {
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          cost: data.cost,
          location: data.location,
          minStock: data.minStock,
          lastUpdated: new Date().toISOString().split("T")[0],
        });
        showToast({
          type: "success",
          message: "Item updated successfully",
        });
      } else {
        addItem({
          name: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          cost: data.cost,
          location: data.location,
          minStock: data.minStock,
          lastUpdated: new Date().toISOString().split("T")[0],
          lowStock: data.quantity < data.minStock,
        });
        showToast({
          type: "success",
          message: "Item added successfully",
        });
      }
      form.reset();
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to save item",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-white">
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc}>
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock Level</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Cost (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : item ? "Update Item" : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
