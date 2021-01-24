import React from 'react';
import { useMediaQuery } from 'react-responsive';

import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';

const ResponsiveHeader = ({ children, isAuthenticated, logout, currentUser }) => {

   const setTheme = (themeName) => {
      document.getElementById("body").className = themeName;
      localStorage.setItem("theme", themeName);
      console.log("Theme set to: ", localStorage.getItem("theme"));
      if (themeName === "default") {
         document.getElementById("body").className = " ";
      }
   }

   const themeSelector = {
      content: `Theme`, key: "themeDropdown",
      options: [
         { text: "⚪", setTheme: () => setTheme('default'), key: "default" },
         { text: "🟢", setTheme: () => setTheme('algae'), key: "algae" },
         { text: "⚫", setTheme: () => setTheme('charcoal'), key: "charcoal" },
         { text: "🔴", setTheme: () => setTheme('lavender'), key: "lavender" },
         { text: "🟣", setTheme: () => setTheme('paper'), key: "paper" }]
   }

   console.log('in responsive header')
   const isDesktopOrLaptop = useMediaQuery({
      query: '(min-device-width: 768px)'
   })
   const isTabletOrMobileDevice = useMediaQuery({
      query: '(max-device-width: 768px)'
   })
   const leftItems = [
      { content: "Home", to: "/", key: "Home", icon: "home" },
      { content: "About", to: "/about", key: "About", icon: "info" }
   ];
   const rightItems = [
      themeSelector,
      { content: "Log in", to: "/login", key: "Login" },
      { content: "Sign up", to: "/signup", key: "Signup" },
   ];
   const authLeftItems = [
      ...leftItems,
      { content: "Create Article", to: "/a/create", key: "Create Article", icon: "pencil" }
   ]
   // add profile pic
   const authRightItems = currentUser ? [
      themeSelector,
      {
         content: `${currentUser.username}`, to: "/profile", key: "profileDropdown",
         options: [{ text: "Profile", to: `/u/${currentUser.username}`, icon: 'user', key: "profile" },
         { text: "Settings", to: "/settings", icon: 'settings', key: "settings" },
         { text: "Help", to: "/help", icon: 'help', key: "help" },
         { text: "Logout", to: "/logout", logout: () => logout(), key: "logout", icon: 'sign out' }]
      }
   ] : [];
   return (
      <>
         {isDesktopOrLaptop && <>
            <DesktopHeader
               leftItems={isAuthenticated ? authLeftItems : leftItems}
               rightItems={isAuthenticated ? authRightItems : rightItems}
            />
            {children}

         </>}
         {isTabletOrMobileDevice && <MobileHeader
            leftItems={isAuthenticated ? authLeftItems : leftItems}
            rightItems={isAuthenticated ? authRightItems : rightItems}
         >
            {children}

         </MobileHeader>}
      </>
   )
}


export default ResponsiveHeader;