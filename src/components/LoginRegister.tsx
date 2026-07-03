import React, { useState } from "react";
import { Mail, Lock, Phone, User as UserIcon, Eye, EyeOff, UserCheck, ShieldAlert, Key } from "lucide-react";
import { User, ViewType } from "../types";

interface LoginRegisterProps {
  initialMode: "login" | "register";
  onAuthSuccess: (token: string, user: User) => void;
  setView: (v: ViewType) => void;
}

export default function LoginRegister({ initialMode, onAuthSuccess, setView }: LoginRegisterProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);

  // Form Fields State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateInput = () => {
    const errs: Record<string, string> = {};

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      errs.email = "Please input a valid email address.";
    }

    if (!password || password.length < 6) {
      errs.password = "Password must be at least 6 characters.";
    }

    if (mode === "register") {
      if (!name.trim()) {
        errs.name = "Full name is required.";
      }
      if (!phone.trim() || !/^\+?(88)?01[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) {
        errs.phone = "Enter a valid Bangladeshi phone number (e.g., 01712345678).";
      }
    }

    setValidationErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!validateInput()) return;

    try {
      setLoading(true);

      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const payload = mode === "login" 
        ? { email, password } 
        : { name, email, phone, password, role };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setSuccessMsg(data.message || (mode === "login" ? "Login successful!" : "Account created successfully!"));

      // Complete Auth Success flow
      setTimeout(() => {
        onAuthSuccess(data.token, data.user);
        setView("home");
      }, 1000);

    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto my-12 max-w-md px-4" id="login_register_page_container font-sans">
      <div className="rounded-sm border-2 border-gray-200 bg-white p-8 shadow-xs">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-none bg-primary-green text-white shadow-sm mb-4 border border-primary-green">
            <Key className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 border-b border-gray-100 pb-2 uppercase leading-tight">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">
            {mode === "login" 
              ? "Access listings, dashboards, and messaging."
              : "Register as a buyer or seller securely."
            }
          </p>
        </div>

        {/* Form alerts */}
        {successMsg && (
          <div className="mt-6 rounded-none bg-green-50 p-3.5 border-2 border-green-500 text-xs font-black uppercase tracking-wider text-green-700">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-6 rounded-none bg-red-50 p-3.5 border-2 border-red-500 text-xs font-black uppercase tracking-wider text-red-700 flex items-center space-x-1.5">
            <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="mt-6 space-y-4" id="auth_form">
          {/* REGISTER EXTRA FIELDS: Name & Phone */}
          {mode === "register" && (
            <>
              <div>
                <label htmlFor="auth_name" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute top-3 left-3 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    id="auth_name"
                    placeholder="Enter your name"
                    className={`w-full rounded-none border-2 py-2.5 pr-4 pl-10 text-xs focus:outline-none ${
                      validationErrors.name ? "border-red-500" : "border-gray-200 focus:border-primary-green"
                    }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {validationErrors.name && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-wide">{validationErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="auth_phone" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute top-3 left-3 h-4.5 w-4.5 text-gray-400" />
                  <input
                    type="text"
                    id="auth_phone"
                    placeholder="e.g. 01712345678"
                    className={`w-full rounded-none border-2 py-2.5 pr-4 pl-10 text-xs focus:outline-none ${
                      validationErrors.phone ? "border-red-500" : "border-gray-200 focus:border-primary-green"
                    }`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                {validationErrors.phone && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-wide">{validationErrors.phone}</p>}
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label htmlFor="auth_email" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute top-3 left-3 h-4.5 w-4.5 text-gray-400" />
              <input
                type="email"
                id="auth_email"
                placeholder="you@domain.com"
                className={`w-full rounded-none border-2 py-2.5 pr-4 pl-10 text-xs focus:outline-none ${
                  validationErrors.email ? "border-red-500" : "border-gray-200 focus:border-primary-green"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {validationErrors.email && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-wide">{validationErrors.email}</p>}
          </div>

          {/* Password (Visible show / hide toggle) */}
          <div>
            <label htmlFor="auth_password" className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute top-3 left-3 h-4.5 w-4.5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                id="auth_password"
                placeholder="••••••••"
                className={`w-full rounded-none border-2 py-2.5 pr-10 pl-10 text-xs focus:outline-none ${
                  validationErrors.password ? "border-red-500" : "border-gray-200 focus:border-primary-green"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-2.5 right-3 text-gray-400 hover:text-primary-green transition"
                title={showPassword ? "Hide password" : "Show password"}
                id="auth_pword_toggle"
              >
                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {validationErrors.password && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-wide">{validationErrors.password}</p>}
          </div>

          {/* REGISTER EXTRA ROLE SELECTOR: Buyer vs Seller */}
          {mode === "register" && (
            <div className="rounded-none border border-gray-150 bg-gray-50 p-4">
              <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Marketplace Role</span>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center justify-center space-x-2 rounded-none border border-gray-200 bg-white p-2.5 text-[10px] font-black uppercase tracking-wider text-gray-700 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="auth_role"
                    className="text-primary-green focus:ring-primary-green"
                    checked={role === "buyer"}
                    onChange={() => setRole("buyer")}
                  />
                  <span>Buyer</span>
                </label>

                <label className="flex items-center justify-center space-x-2 rounded-none border border-gray-200 bg-white p-2.5 text-[10px] font-black uppercase tracking-wider text-gray-700 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="auth_role"
                    className="text-primary-green focus:ring-primary-green"
                    checked={role === "seller"}
                    onChange={() => setRole("seller")}
                  />
                  <span>Seller</span>
                </label>
              </div>
            </div>
          )}

          {/* Submit Authorization Form button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center rounded-none bg-primary-green hover:bg-neutral-900 border-2 border-primary-green py-3 text-xs font-black uppercase tracking-widest text-white shadow-md transition disabled:opacity-50 cursor-pointer"
            id="auth_submit_btn"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Link toggle to switch login/register */}
        <div className="mt-6 text-center text-xs">
          {mode === "login" ? (
            <p className="text-gray-400 uppercase text-[9px] tracking-widest font-extrabold">
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setMode("register");
                  setValidationErrors({});
                  setErrorMsg(null);
                }}
                className="font-black text-primary-gold hover:underline"
                id="auth_switch_to_register"
              >
                Create One
              </button>
            </p>
          ) : (
            <p className="text-gray-400 uppercase text-[9px] tracking-widest font-extrabold">
              Already have an account?{" "}
              <button
                onClick={() => {
                  setMode("login");
                  setValidationErrors({});
                  setErrorMsg(null);
                }}
                className="font-black text-primary-gold hover:underline"
                id="auth_switch_to_login"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
