/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Analytics from './pages/Analytics';
import Coach from './pages/Coach';
import CoachBot from './pages/CoachBot';
import Community from './pages/Community';
import DailyChallenge from './pages/DailyChallenge';
import Duel from './pages/Duel';
import DuoMode from './pages/DuoMode';
import History from './pages/History';
import Home from './pages/Home';
import Leaderboard from './pages/Leaderboard';
import MicroMoment from './pages/MicroMoment';
import Multiplayer from './pages/Multiplayer';
import Practice from './pages/Practice';
import PracticeBot from './pages/PracticeBot';
import Premium from './pages/Premium';
import Profile from './pages/Profile';
import Room from './pages/Room';
import Science from './pages/Science';
import Solo from './pages/Solo';
import SkillTree from './pages/SkillTree';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Analytics": Analytics,
    "Coach": Coach,
    "CoachBot": CoachBot,
    "Community": Community,
    "DailyChallenge": DailyChallenge,
    "Duel": Duel,
    "DuoMode": DuoMode,
    "History": History,
    "Home": Home,
    "Leaderboard": Leaderboard,
    "MicroMoment": MicroMoment,
    "Multiplayer": Multiplayer,
    "Practice": Practice,
    "PracticeBot": PracticeBot,
    "Premium": Premium,
    "Profile": Profile,
    "Room": Room,
    "Science": Science,
    "Solo": Solo,
    "SkillTree": SkillTree,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};