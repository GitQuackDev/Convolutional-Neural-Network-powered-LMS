import React, { useState } from 'react';
import {
  Brain,
  BookOpen,
  Upload,
  BarChart3,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavigationProps {
  userRole?: 'student' | 'professor' | 'admin';
  userName?: string;
  userAvatar?: string;
  notificationCount?: number;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export const MainNavigation: React.FC<NavigationProps> = ({
  userRole = 'student',
  userName = 'John Doe',
  userAvatar,
  notificationCount = 3,
  activeView = 'dashboard',
  onNavigate = () => {}
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const isActive = (view: string) => {
    return activeView === view;
  };

  const studentNavItems = [
    {
      title: "Dashboard",
      view: "dashboard",
      icon: BarChart3,
      description: "View your progress and upcoming assignments"
    },
    {
      title: "Courses",
      view: "courses",
      icon: BookOpen,
      description: "Access your enrolled courses and materials"
    },
    {
      title: "Upload & Analyze",
      view: "upload",
      icon: Upload,
      description: "Upload content for AI-powered analysis"
    },
    {
      title: "Discussions",
      view: "discussions",
      icon: MessageSquare,
      description: "Join course discussions and Q&A"
    }
  ];

  const professorNavItems = [
    {
      title: "Dashboard",
      view: "professor-dashboard",
      icon: BarChart3,
      description: "Monitor class performance and analytics"
    },
    {
      title: "My Courses",
      view: "professor-courses",
      icon: BookOpen,
      description: "Manage your courses and content"
    },
    {
      title: "Analytics",
      view: "professor-analytics",
      icon: Brain,
      description: "CNN analysis insights and student progress"
    },
    {
      title: "Discussions",
      view: "discussions",
      icon: MessageSquare,
      description: "Moderate discussions and provide guidance"
    }
  ];

  const navItems = userRole === 'professor' ? professorNavItems : studentNavItems;

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold">
                LMS CNN
              </h1>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item, index) => {
              const isCurrentActive = isActive(item.view);
              return (
                <Tooltip key={item.view}>
                  <TooltipTrigger asChild>
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant={isCurrentActive ? "default" : "ghost"}
                        className={cn(
                          "relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                          isCurrentActive 
                            ? "" 
                            : "hover:bg-muted/50 hover:scale-105"
                        )}
                        onClick={() => onNavigate(item.view)}
                      >
                        <motion.div
                          animate={isCurrentActive ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <item.icon className="h-4 w-4" />
                        </motion.div>
                        <span className="font-medium">{item.title}</span>
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg hover:bg-muted/50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </Button>

            {/* Mobile Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="relative rounded-lg hover:bg-muted/50">
                    <motion.div
                      animate={notificationCount > 0 ? { 
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 5, 0] 
                      } : {}}
                      transition={{ duration: 0.5, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 3 }}
                    >
                      <Bell className="h-4 w-4" />
                    </motion.div>
                    <AnimatePresence>
                      {notificationCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge 
                            variant="destructive" 
                            className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                          >
                            {notificationCount}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {notificationCount > 0 ? `${notificationCount} new notifications` : 'No new notifications'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* Mobile User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 transition-all duration-200">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback>
                        {userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userRole}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side - Desktop Notifications and User Menu */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="sm" className="relative rounded-lg hover:bg-muted/50">
                    <motion.div
                      animate={notificationCount > 0 ? { 
                        scale: [1, 1.1, 1],
                        rotate: [0, -5, 5, 0] 
                      } : {}}
                      transition={{ duration: 0.5, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 3 }}
                    >
                      <Bell className="h-4 w-4" />
                    </motion.div>
                    <AnimatePresence>
                      {notificationCount > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute -top-1 -right-1"
                        >
                          <Badge 
                            variant="destructive" 
                            className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                          >
                            {notificationCount}
                          </Badge>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  {notificationCount > 0 ? `${notificationCount} new notifications` : 'No new notifications'}
                </p>
              </TooltipContent>
            </Tooltip>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 transition-all duration-200">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userAvatar} alt={userName} />
                      <AvatarFallback>
                        {userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </motion.div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground capitalize">
                      {userRole}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col space-y-2">
                  {navItems.map((item, index) => {
                    const isCurrentActive = isActive(item.view);
                    return (
                      <motion.div
                        key={item.view}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Button
                          variant={isCurrentActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start space-x-3 h-12 text-left rounded-lg transition-all duration-200",
                            isCurrentActive 
                              ? "shadow-sm" 
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => {
                            onNavigate(item.view);
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <motion.div
                            animate={isCurrentActive ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            <item.icon className="h-5 w-5" />
                          </motion.div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {item.description}
                            </span>
                          </div>
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </TooltipProvider>
  );
};
