import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const openSoon = (label) => {
    setMenuOpen(false);
    Alert.alert(label, `${label} module will be added with backend integration.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View style={styles.leftLogoWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.leftLogo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.headerTitle}>Garud Classes</Text>
          </View>

          <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8} onPress={() => setMenuOpen(true)}>
            <Text style={styles.menuBtnText}>☰</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeGreeting}>{greeting}</Text>
          <Text style={styles.welcomeName}>Welcome back, Garud Student</Text>
          <Text style={styles.welcomeSubtext}>Let's continue your preparation journey today.</Text>
        </View>

        <View style={styles.tilesWrap}>
          <Text style={styles.tilesHeading}>Study Zone</Text>

          <TouchableOpacity
            style={styles.tileCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Batches', { screen: 'BatchesList' })}
          >
            <View style={styles.tileIconWrap}>
              <MaterialCommunityIcons name="book-open-page-variant" size={30} color="#000000" />
            </View>
            <Text style={styles.tileTitle}>My Batches</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Batches', { screen: 'Downloads' })}
          >
            <View style={styles.tileIconWrap}>
              <MaterialCommunityIcons name="download-circle-outline" size={30} color="#000000" />
            </View>
            <Text style={styles.tileTitle}>My Downloads</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileCard}
            activeOpacity={0.85}
            onPress={() => Alert.alert('Library', 'Library module will be added next.')}
          >
            <View style={styles.tileIconWrap}>
              <MaterialCommunityIcons name="bookshelf" size={30} color="#000000" />
            </View>
            <Text style={styles.tileTitle}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tileCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Battleground')}
          >
            <View style={styles.tileIconWrap}>
              <MaterialCommunityIcons name="sword-cross" size={30} color="#000000" />
            </View>
            <Text style={styles.tileTitle}>Battlegrounds</Text>
          </TouchableOpacity>
        </View>

        {menuOpen && (
          <>
            <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuOpen(false)} />
            <View style={styles.menuDrawer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuHeaderTitle}>Menu</Text>
                <TouchableOpacity onPress={() => setMenuOpen(false)} style={styles.menuCloseBtn}>
                  <Text style={styles.menuCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Account</Text>
                <TouchableOpacity style={styles.menuActionBtn} onPress={() => { setMenuOpen(false); navigation.navigate('MyProfile'); }}>
                  <MaterialCommunityIcons name="account-circle-outline" size={20} color="#1D4ED8" style={{marginRight: 10}} />
                  <Text style={styles.menuActionText}>My Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuActionBtn}
                  onPress={() => {
                    setMenuOpen(false);
                    navigation.navigate('Batches', { screen: 'MyPurchases' });
                  }}
                >
                  <MaterialCommunityIcons name="cart-outline" size={20} color="#1D4ED8" style={{marginRight: 10}} />
                  <Text style={styles.menuActionText}>My Purchases</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.menuSection}>
                <Text style={styles.menuSectionTitle}>Essentials</Text>
                <TouchableOpacity style={styles.menuActionBtn} onPress={() => { setMenuOpen(false); navigation.navigate('HelpSupport'); }}>
                  <MaterialCommunityIcons name="lifebuoy" size={20} color="#1D4ED8" style={{marginRight: 10}} />
                  <Text style={styles.menuActionText}>Help & Support</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuActionBtn} onPress={() => { setMenuOpen(false); navigation.navigate('Settings'); }}>
                  <MaterialCommunityIcons name="cog-outline" size={20} color="#1D4ED8" style={{marginRight: 10}} />
                  <Text style={styles.menuActionText}>Settings</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  setMenuOpen(false);
                  await logout();
                }}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  leftLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftLogo: {
    width: 34,
    height: 34,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWatermark: {
    position: 'absolute',
    width: 34,
    height: 34,
    opacity: 0.13,
  },
  headerTitle: {
    color: '#0F172A',
    borderRadius:10,
    padding:6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 18,
    fontWeight: '800',
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  menuBtnText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 18,
  },
  tilesWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  welcomeCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  welcomeGreeting: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  welcomeName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  welcomeSubtext: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  tilesHeading: {
    width: '100%',
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  tileCard: {
    width: '31%',
    minHeight: 116,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
  },
  tileIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    zIndex: 10,
  },
  menuDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '76%',
    maxWidth: 330,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    zIndex: 11,
    paddingBottom: 14,
  },
  menuHeader: {
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuHeaderTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  menuCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCloseText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  menuSection: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  menuSectionTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  menuActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  menuActionText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 'auto',
    marginHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1D4ED8',
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
