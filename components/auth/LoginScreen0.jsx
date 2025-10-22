// 📁 components/auth/LoginScreen.jsx
import { StatusBar } from 'expo-status-bar';
import React, { useState, useContext, useEffect } from 'react';
import { View, Alert, StyleSheet, Text, TouchableOpacity, Image, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../contexts/UserContext';
import { redirectToOAuth, getUserInfo } from '../../api/auth';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { KaushanScript_400Regular } from '@expo-google-fonts/kaushan-script';
import SplashScreen from '../common/SplashScreen'; 
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking'; // ✅ 변경
import Feather from 'react-native-vector-icons/Feather';
import { handleOAuthRedirectParams } from '../../api/AuthApi';

//아이콘 필요시 추가
const kakaoIcon = require('../../assets/icons/kakaotalk_icon.png');
const googleIcon = require('../../assets/icons/google_icon.png');
const logoIcon = require('../../assets/icons/logo_icon.png');

export default function LoginScreen() {
  const { setUser } = useContext(UserContext);
  const navigation = useNavigation();
  const [fontsLoaded] = useFonts({ KaushanScript_400Regular });
  const [showSplash, setShowSplash] = useState(false); 

  if (!fontsLoaded) {
    return <SplashScreen />; // 폰트 불러올때까지 스플래시 화면 출력( 폰트 오류를 고치기 위해 추가하였으나 해결불가)
  }

  // ✅ 딥링크로 앱이 돌아왔을 때 토큰과 모드를 추출하여 처리
  useEffect(() => {
    const handleDeepLink = async ({ url }) => {
      console.log('[딥링크 수신] URL:', url);

      try {
        const parsed = Linking.parse(url);
        console.log('[🔍 parsed 전체 구조 확인]', parsed);

        // [ADDED] 명세서 키 그대로 중앙 처리
        const outcome = await handleOAuthRedirectParams(parsed?.queryParams || {}); // [ADDED]

        // [ADDED] 분기: mode=register → 회원가입 화면 / mode=login → 홈
        if (outcome?.next === 'SignUp') { // 신규 사용자
          await AsyncStorage.removeItem('mock'); // [KEEP]
          console.log('🆕 [register] 임시 토큰 저장 완료 → UserInfo 이동');
          navigation.replace('UserInfo'); // [ADDED]
          return;
        }

        if (outcome?.next === 'Home') { // 기존 사용자
          await AsyncStorage.removeItem('mock'); // [KEEP]
          const savedToken = await AsyncStorage.getItem('jwt'); // [ADDED] 중앙 저장된 AT 사용
          if (!savedToken) {
            console.warn('토큰 저장 실패 → 이동 중단');
            Alert.alert('오류', '토큰 저장에 실패했습니다. 다시 시도해주세요.');
            return;
          }

          // 사용자 정보 조회 후 홈 이동 (기존 로직 유지)
          try {
            console.log('📡 사용자 정보 요청 시작');
            const user = await getUserInfo(savedToken);
            const refreshToken = await AsyncStorage.getItem('refreshToken'); // [ADDED]
            setUser({ ...user, accessToken: savedToken, refreshToken });     // [UPDATED]
            await AsyncStorage.setItem('user', JSON.stringify({ ...user, accessToken: savedToken, refreshToken })); // [UPDATED]
            console.log('✅ 사용자 정보 저장 완료 → BottomTab 이동');
            navigation.replace('BottomTab');
            return;
          } catch (error) {
            if (error?.response?.status === 400) {
              console.log('🆕 신규 사용자(400) → UserInfo 이동');
              navigation.replace('UserInfo');
              return;
            }
            Alert.alert('오류', '사용자 정보를 불러오는 데 실패했습니다.');
            return;
          }
        }

        // [ADDED] 방어 로직: 처리할 모드가 없으면 무시
        console.warn('ℹ️ 처리 가능한 딥링크 모드/토큰이 아님 → 무시');
        return;

      } catch (err) {
        console.error('❌ [딥링크 파싱 중 예외 발생]', err);
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('💡 초기 URL 감지됨 → 직접 처리 시작');
        handleDeepLink({ url });
      } else {
        console.log('ℹ️ 앱 처음 실행 시 URL 없음');
      }
    });

    return () => sub.remove();
  }, []);

  // ✅ OAuth 로그인 시작: 버튼 클릭 시 실행됨 → redirectToOAuth 내부에서 redirect_uri 생성 및 백엔드로 전달
  const handleOAuthLogin = async (provider) => {
    try {
      await redirectToOAuth(provider); // ✅ auth.js 내부에서 redirect_uri 자동 생성 및 요청 전송
    } catch (error) {
      console.error('[OAuth 오류]', error);
      Alert.alert('로그인 실패', '알 수 없는 오류가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      <Modal
        visible={showSplash}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSplash(false)} 
      >
        <SplashScreen />
      </Modal>

      <View style={styles.logoContainer}>
        <Text style={styles.appName}>moyeo </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.loginButton, styles.kakaoButton]}
          onPress={() => handleOAuthLogin('kakao')}
        >
          <Image source={kakaoIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>카카오로 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.googleButton]}
          onPress={() => handleOAuthLogin('google')}
        >
          <Image source={googleIcon} style={styles.icon} />
          <Text style={styles.loginButtonText}>Google로 로그인</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, styles.mockButton]}
          onPress={async () => {
            // ✅ [Mock용] UI 개발 흐름 테스트용 임시 로그인 버튼
            await AsyncStorage.setItem('mock', 'true');
            await AsyncStorage.setItem('jwt', 'mock-token');
            navigation.replace('UserInfo');
          }}
        >
          <Text style={styles.mockButtonText}>임시 로그인 (테스트용)</Text>
        </TouchableOpacity>
      </View>
      <View style={{ position: 'absolute', right: 20, bottom: 20, flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity
          style={styles.chatbotButton}
          onPress={() => console.log('챗봇 열기')}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.splashButton}
          onPress={() => setShowSplash(true)} 
        >
          <Ionicons name="rocket-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 40,
  },
  appName: {
    fontSize: 90, // ✅ 병합된 스타일: 팀원 폰트 적용
    fontWeight: 'bold',
    color: '#4F46E5',
    fontFamily: 'KaushanScript_400Regular',
    lineHeight: 200,
    marginBottom: 50,
    marginRight: 10,
  },
  buttonContainer: {
    width: '80%',
    alignItems: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    width: '110%',
    marginBottom: 12,
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
  },
  mockButton: {
    backgroundColor: '#4C5FD5',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 10,
  },
  mockButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  icon: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  splashButton: {                 
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
});