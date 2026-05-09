import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
      <p className="text-lg font-black text-slate-900">Page not found</p>
      <p className="text-sm text-slate-500 mt-2">The page you’re looking for doesn’t exist.</p>
      <Link
        to="/profile"
        className="inline-flex mt-6 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
      >
        Back to profile
      </Link>
    </div>
  );
};

export default NotFound;

