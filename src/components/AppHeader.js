import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const APP_LOGO = require('../../assets/icon.png');

export default function AppHeader({
  title,
  navigation,
  showBack = false,
  left = null,
  right = null,
  showMenu = false,
  onMenuPress,
  style,
  titleAlign = 'center',
}) {
  const isTitleLeft = titleAlign === 'left';

  return (
    <View style={[styles.header, style]}>
      {left ? (
        <View style={styles.leftSlot}>{left}</View>
      ) : showBack ? (
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1D4ED8" />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
      <View style={[styles.titleWrap, isTitleLeft && styles.titleWrapLeft]}>
        <Text style={[styles.headerTitle, isTitleLeft && styles.headerTitleLeft]} numberOfLines={1}>{title}</Text>
      </View>
      {right ? (
        <View style={styles.rightSlot}>{right}</View>
      ) : showMenu ? (
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
          <MaterialCommunityIcons name="menu" size={26} color="#1D4ED8" />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightSlot}>
          <Image source={APP_LOGO} style={styles.defaultLogo} resizeMode="cover" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  leftSlot: { minWidth: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  rightSlot: { minWidth: 36, height: 36, alignItems: 'flex-end', justifyContent: 'center', marginLeft: 8 },
  defaultLogo: { width: 32, height: 32, borderRadius: 8 },
  titleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  titleWrapLeft: { alignItems: 'flex-start', paddingLeft: 8 },
  headerTitle: {
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerTitleLeft: { textAlign: 'left' },
});
