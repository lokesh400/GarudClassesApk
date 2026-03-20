import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';


    export default function AppHeader({ title, navigation, showBack = false, showMenu = false, onMenuPress }) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1D4ED8" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <View style={styles.titleWrap}>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>
      {showMenu ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
          <MaterialCommunityIcons name="menu" size={26} color="#1D4ED8" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );

}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  titleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
