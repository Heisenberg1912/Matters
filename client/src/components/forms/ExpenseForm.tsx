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
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Add New Expense"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6 mt-2 xs:mt-3 sm:mt-4 md:mt-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs xs:text-sm sm:text-base">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id} className="text-sm xs:text-base">
                          {category.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs xs:text-sm sm:text-base">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter expense description"
                      className="min-h-[80px] xs:min-h-[90px] sm:min-h-[100px] text-sm xs:text-base resize-none"
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
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Amount (₹)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs xs:text-sm sm:text-base">Vendor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter vendor name"
                        className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs xs:text-sm" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs xs:text-sm sm:text-base">Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="h-10 xs:h-11 sm:h-12 text-sm xs:text-base"
                      {...field}
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
                {form.formState.isSubmitting ? "Saving..." : expense ? "Update" : "Add Expense"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
