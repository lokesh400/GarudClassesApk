
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, Alert } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import apiClient from '../../api/client';

// Use fallback image for all courses
const COURSE_IMAGE = require('../../../assets/icon.png');

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.45;
const CARD_HEIGHT = 110;

export default function OttHomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState([]);
  const [exploreCourses, setExploreCourses] = useState([]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const [myRes, exploreRes] = await Promise.all([
        apiClient.get('/ott/my-courses'),
        apiClient.get('/ott/explore-courses'),
      ]);
      // For myCourses, map to course object and flatten purchase info
      const myCoursesMapped = myRes.data.map((purchase, idx) => ({
        ...purchase.course,
        purchaseId: purchase.purchaseId,
        purchasedAt: purchase.purchasedAt,
        amount: purchase.amount,
        method: purchase.method,
        status: purchase.status,
        image: COURSE_IMAGE,
        color: ['#F1F5F9', '#FEF9C3', '#DCFCE7', '#F3E8FF'][idx % 4],
      }));
      const exploreCoursesMapped = exploreRes.data.map((course, idx) => ({
        ...course,
        image: COURSE_IMAGE,
        color: ['#F1F5F9', '#FEF9C3', '#DCFCE7', '#F3E8FF'][idx % 4],
      }));
      setMyCourses(myCoursesMapped);
      setExploreCourses(exploreCoursesMapped);
    } catch (err) {
        console.error('Error fetching courses:', err);
      Alert.alert('Error', 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Animated values for each section
  const myScrollX = useRef(new Animated.Value(0)).current;
  const exploreScrollX = useRef(new Animated.Value(0)).current;

  const renderCard = (scrollX) => ({ item, index }) => {
    console.log(item); // Debug log to check course item
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.95, 1, 0.95],
      extrapolate: 'clamp',
    });
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.7, 1, 0.7],
      extrapolate: 'clamp',
    });
    return (
      <Animated.View style={[styles.card, { backgroundColor: item.color, transform: [{ scale }], opacity }]}> 
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.cardTouchable}
          onPress={() => navigation.navigate('OttCourseDetail', { courseId: String(item._id) })}
        >
          <Image source={item.image} style={styles.cardImageSmall} resizeMode="cover" />
              <Text style={styles.cardTitleSmall} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.safeArea}>
      <AppHeader
        title="GC OTT"
        navigation={navigation}
        right={
          <TouchableOpacity onPress={fetchCourses} style={{ marginRight: 8 }}>
            <MaterialCommunityIcons name="refresh" size={26} color="#1D4ED8" />
          </TouchableOpacity>
        }
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1D4ED8" />
        </View>
      ) : (
        <View style={styles.scrollContent}>
          <Text style={styles.heading}>My Purchased Courses</Text>
          {myCourses.length === 0 ? (
            <Text style={styles.emptyText}>You have not purchased any courses yet.</Text>
          ) : (
            <Animated.FlatList
              data={myCourses}
              keyExtractor={item => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 20}
              decelerationRate={0}
              contentContainerStyle={styles.flatListContent}
              renderItem={renderCard(myScrollX)}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: myScrollX } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            />
          )}

          <Text style={styles.heading}>Explore Courses</Text>
          <Animated.FlatList
            data={exploreCourses}
            keyExtractor={item => String(item.id)}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + 20}
            decelerationRate={0}
            contentContainerStyle={styles.flatListContent}
            renderItem={renderCard(exploreScrollX)}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: exploreScrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 12,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    marginLeft: 24,
    marginBottom: 18,
  },
  flatListContent: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    minHeight: CARD_HEIGHT + 30,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    marginHorizontal: 8,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  cardTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  cardImageSmall: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#F1F5F9',
  },
  cardTitleSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
    textAlign: 'center',
    marginHorizontal: 4,
    marginBottom: 10,
  },
});
