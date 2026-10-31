import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import TaskDialogs from './TaskDialogs';
import { TasksProvider } from '../context/TasksContext';
import { ScheduleProvider } from '../context/ScheduleContext';

function Shell() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the mobile drawer after navigating, and scroll back to the top.
  useEffect(() => {
    setNavOpen(false);
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-64">
        <Topbar onMenu={() => setNavOpen(true)} />
        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <TaskDialogs />
    </div>
  );
}

/** Authenticated app shell. Data providers mount here so they only load after sign-in. */
export default function Layout() {
  return (
    <TasksProvider>
      <ScheduleProvider>
        <Shell />
      </ScheduleProvider>
    </TasksProvider>
  );
}
