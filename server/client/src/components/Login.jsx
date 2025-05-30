import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import UserIcon from "./UserIcon";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { toast } from 'react-toastify';
import { USER_API_ENDPOINT } from "../utils/data.js";

const Login = () => {

    const [state, setState] = useState('Login')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { backendUrl, setShowLogin, setToken, setUser } = useContext(AppContext)

    const onSubmitHandler = async (e) => {
        e.preventDefault()

        try {

            if (state === 'Login') {

                const { data } = await axios.post(`${USER_API_ENDPOINT}/login`, { email, password })

                if (data.success) {
                    setToken(data.token)
                    setUser(data.user)
                    localStorage.setItem('token', data.token)
                    setShowLogin(false)
                } else {
                    toast.error(data.message)
                }

            } else {

                const { data } = await axios.post(backendUrl + '/api/user/register', { name, email, password })

                if (data.success) {
                    setToken(data.token)
                    setUser(data.user)
                    localStorage.setItem('token', data.token)
                    setShowLogin(false)
                } else {
                    toast.error(data.message)
                }

            }



        } catch (error) {
            toast.error(error.message)
        }
    }



    useEffect(() => {
        // Disable scrolling on body when the login is open
        document.body.style.overflow = 'hidden';

        // Cleanup function to re-enable scrolling
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => setShowLogin(false)}
      />
      <motion.div
        className="relative z-10 w-[90%] max-w-md"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <form
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          onSubmit={onSubmitHandler}
        >
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-6 text-white">
            <motion.h1 
              className="text-center text-2xl font-medium"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {state}
            </motion.h1>
            <motion.p
              className="text-sm text-center text-blue-100"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {state === "Login" ? "Welcome Back! Please Sign In to Continue" : "Create your account to get started"}
            </motion.p>
          </div>
          <div className="p-8">
            <AnimatePresence mode="wait">
              {state !== "Login" && (
                <motion.div
                  key="nameField"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-4">
                    <motion.div 
                      className={`group border-2 ${touched.name && errors.name ? 'border-red-500' : 'border-gray-200'} px-6 py-3 flex items-center gap-3 rounded-xl focus-within:border-blue-500 transition-all duration-300`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className={`${touched.name && errors.name ? 'text-red-500' : 'text-gray-400'} group-focus-within:text-blue-500 transition-colors`}>
                        <UserIcon size={20} />
                      </div>
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="outline-none text-gray-700 w-full" 
                        placeholder="Full Name" 
                        required
                      />
                    </motion.div>
                    {touched.name && errors.name && (
                      <motion.p 
                        className="text-red-500 text-xs mt-1 ml-2"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mb-4">
              <motion.div 
                className={`group border-2 ${touched.email && errors.email ? 'border-red-500' : 'border-gray-200'} px-6 py-3 flex items-center gap-3 rounded-xl focus-within:border-blue-500 transition-all duration-300`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`${touched.email && errors.email ? 'text-red-500' : 'text-gray-400'} group-focus-within:text-blue-500 transition-colors`}>
                  <img src={assets.email_icon} alt="Email" className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="outline-none text-gray-700 w-full" 
                  placeholder="Email Address" 
                  required
                />
              </motion.div>
              {touched.email && errors.email && (
                <motion.p 
                  className="text-red-500 text-xs mt-1 ml-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </div>
            <div className="mb-4">
              <motion.div 
                className={`group border-2 ${touched.password && errors.password ? 'border-red-500' : 'border-gray-200'} px-6 py-3 flex items-center gap-3 rounded-xl focus-within:border-blue-500 transition-all duration-300`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`${touched.password && errors.password ? 'text-red-500' : 'text-gray-400'} group-focus-within:text-blue-500 transition-colors`}>
                  <img src={assets.lock_icon} alt="Password" className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="outline-none text-gray-700 w-full" 
                  placeholder="Password"
                  required
                />
              </motion.div>
              {touched.password && errors.password && (
                <motion.p 
                  className="text-red-500 text-xs mt-1 ml-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </div>
            {state === "Login" && (
              <motion.p 
                className="text-sm text-right mb-6 text-blue-600 hover:text-blue-700 cursor-pointer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                
              </motion.p>
            )}
            <motion.button
              type="submit"
              className="relative w-full py-3 rounded-xl text-white font-medium overflow-hidden"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || !backendUrl}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300" />
              {loading ? (
                <span className="relative flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" cy="12" r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none" 
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="relative">
                  {state === "Login" ? "Login" : "Create Account"}
                </span>
              )}
            </motion.button>
            <motion.div 
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {state === "Login" ? (
                <p className="text-gray-500">
                  Don't have an account?{" "}
                  <span 
                    className="text-blue-600 font-medium cursor-pointer hover:underline"
                    onClick={() => {
                      setState("Sign Up");
                      setErrors({name: "", email: "", password: ""});
                      setTouched({name: false, email: false, password: false});
                    }}
                  >
                    Sign Up
                  </span>
                </p>
              ) : (
                <p className="text-gray-500">
                  Already have an account?{" "}
                  <span 
                    className="text-blue-600 font-medium cursor-pointer hover:underline"
                    onClick={() => {
                      setState("Login");
                      setErrors({name: "", email: "", password: ""});
                      setTouched({name: false, email: false, password: false});
                    }}
                  >
                    Login
                  </span>
                </p>
              )}
            </motion.div>
          </div>
        </form>
        <motion.button
          className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg"
          whileHover={{ rotate: 90, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowLogin(false)}
        >
          <img src={assets.cross_icon} alt="Close" className="w-5 h-5" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default Login; 