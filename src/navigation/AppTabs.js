import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';

import BatchesStack from './BatchesStack';
import MyTestsStack from './MyTestsStack';
import DashboardStack from './DashboardStack';
import StudyTabs from './StudyTabs';
import BattlegroundStack from './BattlegroundStack';

const Tab = createBottomTabNavigator();

const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#4C1D95',
  primaryLight: '#F3E8FF',

  text: '#111827',
  muted: '#9CA3AF',

  white: '#FFFFFF',
  border: '#F1F5F9',
};

const baseTabBarStyle = {
  position: 'absolute',

  left: 10,
  right: 10,
  // bottom: 8,

  // height: Platform.OS === 'ios' ? 82 : 74,

  backgroundColor: '#FFFFFF',

  borderRadius: 25,

  borderTopWidth: 0,

  paddingTop: 7,

  // paddingBottom:
  //   Platform.OS === 'ios'
  //     ? 13
  //     : 0,

  shadowColor: '#312E81',

  shadowOffset: {
    width: 0,
    height: 8,
  },

  shadowOpacity: 0.13,

  shadowRadius: 20,

  elevation: 18,
};


/* ============================================================
   CUSTOM TAB ICON
============================================================ */

function TabIcon({
  focused,
  activeIcon,
  inactiveIcon,
  label,
  badge = 0,
}) {
  return (
    <View style={styles.tabItem}>

      <View
        style={[
          styles.iconContainer,

          focused &&
            styles.activeIconContainer,
        ]}
      >

        <MaterialCommunityIcons
          name={
            focused
              ? activeIcon
              : inactiveIcon
          }
          size={
            focused
              ? 25
              : 23
          }
          color={
            focused
              ? COLORS.primary
              : COLORS.muted
          }
        />


        {/* BADGE */}

        {badge > 0 && (
          <View style={styles.badge}>

            <Text style={styles.badgeText}>
              {badge > 9
                ? '9+'
                : badge}
            </Text>

          </View>
        )}

      </View>


      {/* LABEL */}

      <Text
        numberOfLines={1}
        style={[
          styles.tabLabel,

          focused &&
            styles.activeTabLabel,
        ]}
      >
        {label}
      </Text>

    </View>
  );
}


/* ============================================================
   MAIN APP TABS
============================================================ */

export default function AppTabs() {

  return (

    <Tab.Navigator

      initialRouteName="Dashboard"

      screenOptions={{

        headerShown: false,

        tabBarShowLabel: false,

        tabBarHideOnKeyboard: true,

        tabBarStyle:
          baseTabBarStyle,

        tabBarItemStyle: {
          paddingVertical: 0,
        },

        lazy: true,

      }}

    >


      {/* =====================================================
          DASHBOARD
      ===================================================== */}

      <Tab.Screen

        name="Dashboard"

        component={DashboardStack}

        options={{

          tabBarIcon: ({
            focused,
          }) => (

            <TabIcon

              focused={focused}

              activeIcon="home-variant"

              inactiveIcon="home-variant-outline"

              label="Home"

            />

          ),

        }}

      />


      {/* =====================================================
          BATCHES
      ===================================================== */}

      <Tab.Screen

        name="Batches"

        component={BatchesStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Batches', { state: { routes: [{ name: 'BatchesList' }] } });
          },
        })}

        options={({ route }) => {

          const routeName =

            getFocusedRouteNameFromRoute(
              route
            ) || 'BatchesList';


          const hideTabBar = [

            'TestAttempt',

            'AttachmentViewer',

            'PurchasePreview',

          ].includes(routeName);


          return {

            tabBarIcon: ({
              focused,
            }) => (

              <TabIcon

                focused={focused}

                activeIcon="book-open-page-variant"

                inactiveIcon="book-open-page-variant-outline"

                label="All Batches"

              />

            ),


            popToTopOnBlur: true,

            unmountOnBlur: true,


            tabBarStyle: hideTabBar

              ? {

                  ...baseTabBarStyle,

                  display: 'none',

                }

              : baseTabBarStyle,

          };

        }}

      />


      {/* =====================================================
          STUDY
      ===================================================== */}

      <Tab.Screen

        name="Study"

        component={StudyTabs}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Study', { state: { routes: [{ name: 'StudyHome' }] } });
          },
        })}

        options={({ route }) => {

          const routeName =

            getFocusedRouteNameFromRoute(
              route
            ) || 'StudyHome';


          const hideTabBar = [

            'StudyYoutubeVideoPlayer',

            'AttachmentViewer',

            'TestAttempt',

            'Downloads',

          ].includes(routeName);


          return {

            tabBarIcon: ({
              focused,
            }) => (

              <TabIcon

                focused={focused}

                activeIcon="play-box-multiple"

                inactiveIcon="play-box-multiple-outline"

                label="Study"

              />

            ),


            unmountOnBlur: true,

            popToTopOnBlur: true,


            tabBarStyle: hideTabBar

              ? {

                  ...baseTabBarStyle,

                  display: 'none',

                }

              : baseTabBarStyle,

          };

        }}

      />


      {/* =====================================================
          BATTLEGROUND
      ===================================================== */}

      <Tab.Screen

        name="Battleground"

        component={BattlegroundStack}

        options={({ route }) => {

          const routeName =

            getFocusedRouteNameFromRoute(
              route
            ) || 'BattlegroundMain';


          const hideTabBar =

            routeName ===
            'BattlegroundAttempt';


          return {

            tabBarIcon: ({
              focused,
            }) => (

              <TabIcon

                focused={focused}

                activeIcon="trophy"

                inactiveIcon="trophy-outline"

                label="Battle"

              />

            ),


            tabBarStyle: hideTabBar

              ? {

                  ...baseTabBarStyle,

                  display: 'none',

                }

              : baseTabBarStyle,

          };

        }}

      />


      {/* =====================================================
          MY TESTS
      ===================================================== */}

      <Tab.Screen

        name="MyTests"

        component={MyTestsStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('MyTests', { state: { routes: [{ name: 'MyTestsList' }] } });
          },
        })}

        options={({ route }) => {

          const routeName =

            getFocusedRouteNameFromRoute(
              route
            ) || 'MyTestsList';


          const hideTabBar = [

            'TestAttempt',

            'AttachmentViewer',

          ].includes(routeName);


          return {

            tabBarIcon: ({
              focused,
            }) => (

              <TabIcon

                focused={focused}

                activeIcon="clipboard-check"

                inactiveIcon="clipboard-check-outline"

                label="Tests"

              />

            ),


            popToTopOnBlur: true,

            unmountOnBlur: true,


            tabBarStyle: hideTabBar

              ? {

                  ...baseTabBarStyle,

                  display: 'none',

                }

              : baseTabBarStyle,

          };

        }}

      />

    </Tab.Navigator>

  );

}


/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({

  tabItem: {

    alignItems: 'center',

    justifyContent: 'center',

    minWidth: 58,

  },


  /* =========================================================
     ICON
  ========================================================= */

  iconContainer: {

    width: 43,

    height: 35,

    borderRadius: 13,

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

  },


  activeIconContainer: {

    backgroundColor:
      COLORS.primaryLight,

  },


  /* =========================================================
     LABEL
  ========================================================= */

  tabLabel: {

    marginTop: 3,

    fontSize: 9,

    fontWeight: '600',

    color: COLORS.muted,

    textAlign: 'center',

  },


  activeTabLabel: {

    color: COLORS.primary,

    fontWeight: '800',

  },


  /* =========================================================
     BADGE
  ========================================================= */

  badge: {

    position: 'absolute',

    top: -5,

    right: -4,

    minWidth: 17,

    height: 17,

    paddingHorizontal: 4,

    borderRadius: 9,

    backgroundColor: '#EF4444',

    alignItems: 'center',

    justifyContent: 'center',

    borderWidth: 2,

    borderColor: '#FFFFFF',

  },


  badgeText: {

    color: '#FFFFFF',

    fontSize: 8,

    fontWeight: '900',

  },

});