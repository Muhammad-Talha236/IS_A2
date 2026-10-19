import React from 'react';
import AppLayout from './AppLayout.jsx';
import { useNavigation } from '../../hooks/useNavigation.js';
import { useAcademicData } from '../../hooks/useAcademicData.js';
import { useSecurityMode } from '../../context/SecurityModeContext.jsx';
import StatusMessage from '../ui/StatusMessage.jsx';
import Dashboard from '../../pages/Dashboard.jsx';
import Courses from '../../pages/Courses.jsx';
import CourseSearch from '../../pages/CourseSearch.jsx';
import Discussions from '../../pages/Discussions.jsx';
import Announcements from '../../pages/Announcements.jsx';
import Profile from '../../pages/Profile.jsx';
import GradeAvailability from '../../pages/GradeAvailability.jsx';
import StudentRecords from '../../pages/StudentRecords.jsx';
import SecurityGuide from '../../pages/SecurityGuide.jsx';
export default function Workspace() {
  const { page, navigate } = useNavigation();
  const { mode } = useSecurityMode();
  const { courses, assessments, error, loading } = useAcademicData();
  const pages = { dashboard: Dashboard, courses: Courses, search: CourseSearch, discussions: Discussions, announcements: Announcements, profile: Profile, grades: GradeAvailability, records: StudentRecords, guide: SecurityGuide };
  const Page = pages[page];
  return <AppLayout page={page} navigate={navigate}><StatusMessage tone="error">{error}</StatusMessage>{loading ? <StatusMessage>Loading your academic workspace...</StatusMessage> : <Page key={page + mode} mode={mode} courses={courses} assessments={assessments} onNavigate={navigate} />}</AppLayout>;
}
