import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../auth/AuthContext';

const { width } = Dimensions.get('window');
const ACTION_GAP = 12;
const ACTION_CARD_WIDTH = (width - 32 - ACTION_GAP) / 2;

export default function DashboardScreen({ navigation }) {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const openSoon = (label) => {
    setMenuOpen(false);
    Alert.alert(label, `${label} module will be added with backend integration.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <View style={styles.bgBlobTop} />
        <View style={styles.bgBlobBottom} />

        <View style={styles.header}>
          <View style={styles.brandWrap}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brandTitle}>Garud Classes</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.menuBtn} activeOpacity={0.85} onPress={() => setMenuOpen(true)}>
            <MaterialCommunityIcons name="menu" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <View style={styles.heroTopRow}>
              <Text style={styles.welcomeGreeting}>{greeting}</Text>
              <View style={styles.readyPill}>
                <MaterialCommunityIcons name="flash" size={12} color="#BFDBFE" />
                <Text style={styles.readyPillText}>Ready</Text>
              </View>
            </View>

            <Text style={styles.welcomeName}>Welcome back, Garud Student</Text>
            <Text style={styles.welcomeSubtext}>Build momentum today with lectures, practice, and challenges.</Text>

            <View style={styles.heroStatRow}>
              <View style={styles.heroStatPill}>
                <MaterialCommunityIcons name="book-open-variant" size={18} color="#DBEAFE" />
                <Text style={styles.heroStatLabel}>Batches</Text>
              </View>
              <View style={styles.heroStatPill}>
                <MaterialCommunityIcons name="download-circle-outline" size={18} color="#DBEAFE" />
                <Text style={styles.heroStatLabel}>Downloads</Text>
              </View>
              <View style={styles.heroStatPill}>
                <MaterialCommunityIcons name="sword-cross" size={18} color="#DBEAFE" />
                <Text style={styles.heroStatLabel}>Battleground</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <Text style={styles.sectionSubTitle}>Jump right in</Text>
          </View>

          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardBlue]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Batches', { screen: 'BatchesList' })}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="book-open-page-variant" size={26} color="#1D4ED8" />
              </View>
              <Text style={styles.actionTitle}>My Batches</Text>
              <Text style={styles.actionHint}>Resume your classes</Text>
              <View style={styles.actionFooter}>
                <Text style={styles.actionFooterText}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#1D4ED8" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardGreen]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Batches', { screen: 'Downloads' })}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="download-circle-outline" size={26} color="#047857" />
              </View>
              <Text style={styles.actionTitle}>Downloads</Text>
              <Text style={styles.actionHint}>Study offline anytime</Text>
              <View style={styles.actionFooter}>
                <Text style={[styles.actionFooterText, { color: '#047857' }]}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#047857" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardAmber]}
              activeOpacity={0.88}
              onPress={() => openSoon('Library')}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="bookshelf" size={26} color="#B45309" />
              </View>
              <Text style={styles.actionTitle}>Library</Text>
              <Text style={styles.actionHint}>Books and notes</Text>
              <View style={styles.actionFooter}>
                <Text style={[styles.actionFooterText, { color: '#B45309' }]}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#B45309" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, styles.actionCardRose]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('Battleground')}
            >
              <View style={styles.actionIconWrap}>
                <MaterialCommunityIcons name="sword-cross" size={26} color="#BE123C" />
              </View>
              <Text style={styles.actionTitle}>Battleground</Text>
              <Text style={styles.actionHint}>Compete and rank up</Text>
              <View style={styles.actionFooter}>
                <Text style={[styles.actionFooterText, { color: '#BE123C' }]}>Open</Text>
                <MaterialCommunityIcons name="arrow-right" size={16} color="#BE123C" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.supportCard}>
            <Text style={styles.supportTitle}>Need Quick Help?</Text>
            <Text style={styles.supportSubTitle}>Access help, settings, or purchases from one place.</Text>

            <View style={styles.supportActionsRow}>
              <TouchableOpacity
                style={styles.supportActionBtn}
                onPress={() => navigation.navigate('HelpSupport')}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="lifebuoy" size={16} color="#1D4ED8" />
                <Text style={styles.supportActionText}>Help & Support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.supportActionBtn}
                onPress={() => navigation.navigate('Batches', { screen: 'MyPurchases' })}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="cart-outline" size={16} color="#1D4ED8" />
                <Text style={styles.supportActionText}>My Purchases</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  bgBlobTop: {
    position: 'absolute',
    top: -95,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DBEAFE',
    opacity: 0.35,
  },
  bgBlobBottom: {
    position: 'absolute',
    bottom: -120,
    left: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#E0F2FE',
    opacity: 0.45,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: 'rgba(248,250,252,0.92)',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 10,
  },
  brandTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  brandSubTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 28,
  },
  heroCard: {
    marginHorizontal: 16,
    marginTop: 6,
    overflow: 'hidden',
    backgroundColor: '#1D4ED8',
    borderWidth: 1,
    borderColor: '#1E40AF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.20)',
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.45)',
    gap: 4,
  },
  readyPillText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -60,
    right: -40,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -38,
    left: -26,
  },
  welcomeGreeting: {
    color: '#BFDBFE',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  welcomeName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  welcomeSubtext: {
    color: '#DBEAFE',
    fontSize: 13,
    fontWeight: '700',
  },
  heroStatRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatPill: {
    width: '31%',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(191,219,254,0.35)',
  },
  heroStatLabel: {
    marginTop: 4,
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 19,
    fontWeight: '800',
  },
  sectionSubTitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    marginHorizontal: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: ACTION_GAP,
  },
  actionCard: {
    width: ACTION_CARD_WIDTH,
    minHeight: 132,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  actionCardBlue: { backgroundColor: '#EEF4FF', borderColor: '#D6E4FF' },
  actionCardGreen: { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' },
  actionCardAmber: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  actionCardRose: { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  actionHint: {
    marginTop: 4,
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  actionFooter: {
    marginTop: 'auto',
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionFooterText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '800',
  },
  supportCard: {
    marginTop: 14,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  supportTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  supportSubTitle: {
    marginTop: 4,
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  supportActionsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  supportActionBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  supportActionText: {
    color: '#1E3A8A',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: '#FFFFFF',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
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
