import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter, MemoryRouter } from "react-router-dom";
import Login from "./Login";
import * as AuthContext from "@/context/AuthContext";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  },
}));

// Mock useAuth hook
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Login Page", () => {
  const defaultAuthContext = {
    login: mockLogin,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    user: null,
    isCustomer: false,
    isContractor: false,
    isAdmin: false,
    isSuperAdmin: false,
    hasRole: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    refreshUser: vi.fn(),
    clearError: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, "useAuth").mockReturnValue(defaultAuthContext);
  });

  const renderLogin = () => {
    return render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
  };

  describe("Rendering", () => {
    it("should render login form", () => {
      renderLogin();

      expect(screen.getByText("Matters")).toBeInTheDocument();
      expect(screen.getByText("Construction Management Dashboard")).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      renderLogin();

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it("should render create account link", () => {
      renderLogin();

      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/create account/i)).toBeInTheDocument();
    });

    it("should show loading spinner when auth is loading", () => {
      vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        ...defaultAuthContext,
        isLoading: true,
      });

      renderLogin();

      // Loading state shows spinner instead of form
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should disable submit button when fields are empty", () => {
      renderLogin();

      const submitButton = screen.getByRole("button", { name: /login/i });
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when fields are filled", async () => {
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: /login/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe("Password Visibility", () => {
    it("should toggle password visibility", async () => {
      renderLogin();
      const user = userEvent.setup();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");

      // Find the toggle button (has Eye icon initially)
      const toggleButton = screen.getByRole("button", { name: "" });
      await user.click(toggleButton);

      expect(passwordInput).toHaveAttribute("type", "text");

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute("type", "password");
    });
  });

  describe("Form Submission", () => {
    it("should call login with email and password on submit", async () => {
      mockLogin.mockResolvedValue(undefined);
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "password123");
    });

    it("should show loading state during submission", async () => {
      mockLogin.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    });

    it("should display error message on login failure", async () => {
      mockLogin.mockRejectedValue(new Error("Invalid credentials"));
      renderLogin();
      const user = userEvent.setup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /login/i });

      await user.type(emailInput, "wrong@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
      });
    });
  });

  describe("Authentication Redirects", () => {
    it("should redirect customer to /home when authenticated", async () => {
      vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: true,
        user: {
          _id: "123",
          email: "customer@example.com",
          name: "Customer",
          role: "user",
        } as any,
      });

      renderLogin();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/home", { replace: true });
      });
    });

    it("should redirect contractor to /contractor/dashboard when authenticated", async () => {
      vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: true,
        user: {
          _id: "123",
          email: "contractor@example.com",
          name: "Contractor",
          role: "contractor",
        } as any,
      });

      renderLogin();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/contractor/dashboard", {
          replace: true,
        });
      });
    });

    it("should redirect admin to /admin/dashboard when authenticated", async () => {
      vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        ...defaultAuthContext,
        isAuthenticated: true,
        user: {
          _id: "123",
          email: "admin@example.com",
          name: "Admin",
          role: "admin",
        } as any,
      });

      renderLogin();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/admin/dashboard", {
          replace: true,
        });
      });
    });
  });

  describe("Error Display", () => {
    it("should display auth context error", () => {
      vi.spyOn(AuthContext, "useAuth").mockReturnValue({
        ...defaultAuthContext,
        error: "Session expired. Please login again.",
      });

      renderLogin();

      expect(screen.getByText("Session expired. Please login again.")).toBeInTheDocument();
    });
  });
});
