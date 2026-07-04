import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StudyHomeScreen from '../screens/study/StudyHomeScreen';
import StudyCourseDetailScreen from '../screens/study/StudyCourseDetailScreen';
import StudySubjectDetailScreen from '../screens/study/StudySubjectDetailScreen';
import StudyChapterDetailScreen from '../screens/study/StudyChapterDetailScreen';
import StudyYoutubeVideoPlayerScreen from '../screens/study/StudyYoutubeVideoPlayerScreen';
import AttachmentViewerScreen from '../screens/batches/AttachmentViewerScreen';
import DownloadsScreen from '../screens/batches/DownloadsScreen';
import TestAttemptScreen from '../screens/batches/TestAttemptScreen';
import TestResultScreen from '../screens/batches/TestResultScreen';

const Stack = createNativeStackNavigator();

export default function StudyTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudyHome" component={StudyHomeScreen} />
      <Stack.Screen name="StudyCourseDetail" component={StudyCourseDetailScreen} />
      <Stack.Screen name="StudySubjectDetail" component={StudySubjectDetailScreen} />
      <Stack.Screen name="StudyChapterDetail" component={StudyChapterDetailScreen} />
      <Stack.Screen name="StudyYoutubeVideoPlayer" component={StudyYoutubeVideoPlayerScreen} />
      <Stack.Screen name="AttachmentViewer" component={AttachmentViewerScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="TestAttempt" component={TestAttemptScreen} />
      <Stack.Screen name="TestResult" component={TestResultScreen} />
    </Stack.Navigator>
  );
}
