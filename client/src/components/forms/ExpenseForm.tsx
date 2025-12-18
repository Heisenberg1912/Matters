import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormData } from "@/lib/validations";
import { useBudgetStore } from "@/store";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/store/types";

interface ExpenseFormProps {
  expense?: Expense;
  open: boolean;
  onClose: () => void;
}

export function ExpenseForm({ expense, open, onClose }: ExpenseFormProps) {
  const categories = useBudgetStore((state) => state.categories);
  const addExpense = useBudgetStore((state) => state.addExpense);
  const updateExpense = useBudgetStore((state) => state.updateExpense);
  const { showToast } = useNotifications();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense
      ? {
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          vendor: expense.vendor,
          date: expense.date,
        }
      : {
          category: "",
          description: "",
          amount: 0,
          vendor: "",
          date: new Date().toISOString().split("T")[0],
        },
  });

  const onSubmit = (data: ExpenseFormData) => {
    try {
      if (expense) {
        updateExpense(expense.id, {
          category: data.category,
          description: data.description,
          amount: data.amount,
          vendor: data.vendor,
          date: data.date,
        });
        showToast({
          type: "success",
          message: "Expense updated successfully",
        });
      } else {
        addExpense({
          category: data.category,
          description: data.description,
          amount: data.amount,
          vendor: data.vendor,
          date: data.date,
        });
        showToast({
          type: "success",
          message: "Expense added successfully",
        });
      }
      form.reset();
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        message: "Failed to save expense",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-semibold text-white">
            {expense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter expense description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter vendor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                {form.formState.isSubmitting ? "Saving..." : expense ? "Update Expense" : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
