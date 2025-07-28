import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Bell, Search, User, Settings, LogOut } from "lucide-react";
import { Button } from "../../shared/ui";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications] = useState(3);

  return (
    <header className="bg-white border-b-2 border-black shadow-pixel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <img
              src="/OtteReview_pixel.png"
              alt="OtteReview"
              className="w-8 h-12"
              style={{ imageRendering: "pixelated" }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            <span
              className="text-white font-bold text-sm"
              style={{ display: "none" }}
            >
              O
            </span>
            <div className="flex items-center">
              <img
                src="/OtteReview_logo.png"
                alt="OtteReview"
                className="h-12"
                style={{ imageRendering: "pixelated" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <span className="pixel-logo text-lg" style={{ display: "none" }}>
                OtteReview
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-stone-700 hover:text-primary-600 font-medium pixel-hover"
            >
              대시보드
            </Link>
            <Link
              to="/pr"
              className="text-stone-700 hover:text-primary-600 font-medium pixel-hover"
            >
              PR 목록
            </Link>
            <Link
              to="/pr/create"
              className="text-stone-700 hover:text-primary-600 font-medium pixel-hover"
            >
              PR 생성
            </Link>
          </nav>

          {/* Search Bar */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="검색..."
                className="soft-input pl-10 w-64"
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-stone-600 hover:text-primary-600 pixel-hover">
              <Bell className="w-5 h-5" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center border border-white">
                  {notifications}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div className="relative">
              <button className="flex items-center space-x-2 p-2 text-stone-700 hover:text-primary-600 pixel-hover">
                <div className="w-8 h-8 bg-primary-500 border-2 border-black rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block font-medium">김개발</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-stone-600 hover:text-primary-600 pixel-hover"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-black">
            <div className="space-y-4">
              <Link
                to="/dashboard"
                className="block text-stone-700 hover:text-primary-600 font-medium pixel-hover"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                대시보드
              </Link>
              <Link
                to="/pr"
                className="block text-stone-700 hover:text-primary-600 font-medium pixel-hover"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PR 목록
              </Link>
              <Link
                to="/pr/create"
                className="block text-stone-700 hover:text-primary-600 font-medium pixel-hover"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                PR 생성
              </Link>

              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="검색..."
                  className="soft-input pl-10 w-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
