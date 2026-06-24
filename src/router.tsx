import { createBrowserRouter, Navigate } from 'react-router-dom'
import { Launcher } from './pages/Launcher'
import { Pitch } from './pages/Pitch'
import { StudioLayout } from './studio/StudioLayout'
import { HomeFeed } from './studio/HomeFeed'
import { Dashboard } from './studio/Dashboard'
import { SearchScreen } from './studio/SearchScreen'
import { Review } from './studio/Review'
import { NewCasting } from './studio/NewCasting'
import { CastingRecap } from './studio/CastingRecap'
import { AgencySelect } from './studio/AgencySelect'
import { CastingSearch } from './studio/CastingSearch'
import { SelectionConsole } from './studio/SelectionConsole'
import { Wall } from './studio/Wall'
import { AppLayout } from './app/AppLayout'
import { Discover } from './app/Discover'
import { Profile } from './app/Profile'
import { CastingDetail } from './app/CastingDetail'
import { SelfTape } from './app/SelfTape'
import { Auditions } from './app/Auditions'
import { TalentDesktopLayout } from './talent/TalentDesktopLayout'
import { TalentProfilePage } from './talent/TalentProfilePage'
import { CastingCalls } from './talent/CastingCalls'
import { TalentAuditions } from './talent/TalentAuditions'
import { Messages } from './talent/Messages'
import { Notifications } from './talent/Notifications'

export const router = createBrowserRouter([
  { path: '/', element: <Launcher /> },
  { path: '/pitch', element: <Pitch /> },

  // Production (web / desktop)
  {
    path: '/studio',
    element: <StudioLayout />,
    children: [
      { index: true, element: <HomeFeed /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'search', element: <SearchScreen /> },
      { path: 'review', element: <Review /> },
      { path: 'new-casting',    element: <NewCasting /> },
      { path: 'casting-recap',  element: <CastingRecap /> },
      { path: 'agency-select',  element: <AgencySelect /> },
      { path: 'casting-search', element: <CastingSearch /> },
      { path: 'selection',      element: <SelectionConsole /> },
      { path: 'wall',           element: <Wall /> },
    ],
  },

  // Talent (mobile, inside phone frame)
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      { index: true, element: <Discover /> },
      { path: 'profile', element: <Profile /> },
      { path: 'casting/:id', element: <CastingDetail /> },
      { path: 'selftape/:id', element: <SelfTape /> },
      { path: 'auditions', element: <Auditions /> },
    ],
  },

  // Talent (web / desktop — LinkedIn-style space)
  {
    path: '/talent',
    element: <TalentDesktopLayout />,
    children: [
      { index: true, element: <HomeFeed /> },
      { path: 'casting-calls', element: <CastingCalls /> },
      { path: 'auditions', element: <TalentAuditions /> },
      { path: 'messages', element: <Messages /> },
      { path: 'notifications', element: <Notifications /> },
      { path: 'profile', element: <TalentProfilePage /> },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
], {
  basename: import.meta.env.BASE_URL,
  future: { v7_relativeSplatPath: true },
})
