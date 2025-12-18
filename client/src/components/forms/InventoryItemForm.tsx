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
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {item ? "Edit Inventory Item" : "Add Inventory Item"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mt-2 xs:mt-3 sm:mt-4 md:mt-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs xs:text-sm sm:text-base">Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter item name"
                      className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-xs xs:text-sm" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-3 xs:gap-4 sm:gap-5 md:gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-sm xs:text-base">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Storage Location</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc} value={loc} className="text-sm xs:text-base">
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 xs:gap-4 sm:gap-5 md:gap-6 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit} className="text-sm xs:text-base">
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minStock"
                render={({ field }) => (
                  <FormItem className="col-span-2 sm:col-span-1">
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Min Stock</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="10"
                        className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs xs:text-sm sm:text-base">Unit Cost (₹)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage className="text-xs xs:text-sm" />
                </FormItem>
              )}
            />

            <div className="flex flex-col-reverse xs:flex-row justify-end gap-2 xs:gap-3 sm:gap-4 pt-2 xs:pt-3 sm:pt-4">
              <Button
                type="button"
                variant="ghost"
                className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base px-4 xs:px-5 sm:px-6"
                onClick={() => {
                  form.reset();
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base px-4 xs:px-5 sm:px-6"
              >
                {form.formState.isSubmitting ? "Saving..." : item ? "Update" : "Add Item"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
