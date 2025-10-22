// 📁 api/auth_fetch.js
// ✅ fetch 기반으로 구성된 API 함수 모음
// - React Native (Expo Go 호환)
// - 회원가입은 multipart/form-data 방식 + JSON을 파일처럼 처리
// - 사용자 정보 조회 및 수정도 포함

import * as Linking from 'expo-linking';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

/**
 * 1. OAuth2.0 로그인 요청 (auth.js로 이전됨, 기존 사용되지 않음.)
 * - OAuth 로그인 페이지로 리디렉션
 * - 백엔드가 redirect_uri를 기준으로 JWT 및 mode 포함한 딥링크 리디렉션
 *
 * //  * @param {string} provider - 소셜 로그인 제공자 ('kakao', 'google' 등)
 * //  */
// export const redirectToOAuthWithFetch = async (provider) => {
//   try {
//     const redirectUri = Linking.createURL('/'); // 또는 '/callback' 등 명시적으로 써줘야 함
//     const oauthUrl = `${BASE_URL}/oauth2/authorization/${provider}?redirect_uri=${encodeURIComponent(redirectUri)}`;
//     console.log('🔗 OAuth 로그인 요청 URL:', oauthUrl);
//     await Linking.openURL(oauthUrl);

//   } catch (error) {
//     console.error('❌ OAuth2.0 로그인 요청 실패:', error);
//     throw error;
//   }
// };


// 2. 회원가입 요청 (FormData 전송 방식)
// ✅ fetch 기반 회원가입 API (multipart/form-data, key 분해 방식)
export const registerUserWithFetch = async (userData, image, token) => {
  try {
    // 인자로 받은 token 우선, 없으면 'jwt'에서 조회
    const bearer = token ?? (await AsyncStorage.getItem('jwt'));
    if (!bearer) throw new Error('JWT 토큰이 없습니다. (AsyncStorage key: jwt)');
    const formData = new FormData();

    // 1. JSON 데이터 → Blob-like 가짜 파일처럼 첨부
    const jsonString = JSON.stringify(userData);
    const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
    
    formData.append('userInfo', {
      uri: `data:application/json;base64,${base64Encoded}`, // ❗ uri는 여전히 필요함
      type: 'application/json',
      name: 'userInfo.json',
    });

    if (image) {
      console.log('📸 이미지 정보 확인');
      console.log('uri:', image.uri);
      console.log('type:', image.type);
      console.log('name:', image.name);

      // Base64 인코딩된 이미지 크기 로그 (전송 직전,) 파악 후 삭제 요먕.
      if (image.uri && image.uri.startsWith('data:image')) {
        const base64String = image.uri.split(',')[1];
        const size = Math.floor((base64String.length * 3) / 4);
        console.log('📏 [전송 Base64 이미지 용량] ' + size + ' bytes ≈ ' + (size / 1024).toFixed(1) + ' KB');
      } else if (image.uri && image.uri.startsWith('file://')) {
        const info = await FileSystem.getInfoAsync(image.uri);
        console.log('📏 [원본 파일 용량] ' + info.size + ' bytes ≈ ' + (info.size / 1024).toFixed(1) + ' KB');
      }

      formData.append('profileImage', {
        uri: image.uri,
        type: image.type?.includes('image') ? 'image/jpeg' : image.type || 'image/jpeg', // 💡 fallback 처리
        name: image.name || 'profile.jpg',
      });
    }

    // ✅ 디버깅 도구는 여기에 삽입
    // (FormData._parts는 RN 환경에서만 존재. 빌드 환경에 따라 없음)
    if (formData?._parts) {
      for (let pair of formData._parts) {
        console.log(`🧾 FormData 항목: ${pair[0]}`);
        if (typeof pair[1] === 'object' && pair[1]?.uri) {
          console.log(`📦   name: ${pair[1].name}`);
          console.log(`📦   type: ${pair[1].type}`);
          console.log(`📦   uri: ${pair[1].uri}`);
        } else {
          console.log(`📄   value: ${pair[1]}`);
        }
      }
    }

    const response = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${bearer}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [fetch] 응답 오류 상태:', response.status);
      console.error('📦 응답 바디:', errorText);
      throw new Error(errorText); // 응답 바디 전체를 Error에
    }

    const result = await response.json();
    console.log('✅ [fetch] 회원가입 성공 응답:', result);
    return result;

  } catch (error) {
    console.error('❌ [fetch] 회원가입 실패:', error);
    throw error;
  }
};


/**
 * 3. 사용자 정보 조회 (홈화면, 프로필 화면 등에서 사용)
 * - JWT 토큰 기반으로 사용자 정보를 조회함
 * - 실패 시 400 응답은 null 반환
 *
 * @param {string} token - JWT 토큰
 * @returns {Object|null} 사용자 정보 객체 또는 null
 */
export const getUserInfoWithFetch = async (token) => {
  const response = await fetch(`${BASE_URL}/user/profile`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 400) {
      console.warn('⚠️ 사용자 정보 없음 (400)');
      return null;
    }
    const errText = await response.text();
    console.error('❌ 사용자 정보 조회 실패:', response.status, errText);
    throw new Error(`조회 실패 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  console.log('✅ 사용자 정보 조회 성공:', data);
  return data;
};

/**
 * 사용자 프로필 수정 요청 (multipart/form-data)
 * - userInfo는 JSON → Base64 → JSON 파일로 전송
 * - profileImage는 새로 선택한 경우에만 FormData에 append
 * - 기존 이미지 유지 시에는 profileImage 필드를 아예 전송하지 않음
 *
 * @param {Object} userData - { nickname, gender, age, mbti }
 * @param {Object|string|null} image - 새로 선택된 이미지 객체 or 기존 string or null
 * @param {string} token - JWT 토큰
 * @returns {Object} 응답 데이터 or 빈 객체
 */
export const editUserProfileWithFetch = async (userData, image, token) => {
  const formData = new FormData();

  // ✅ 사용자 정보 → JSON → Base64 → 파일처럼 전송
  const userInfoJson = JSON.stringify({
    nickname: userData.nickname,
    gender: userData.gender === '남성' ? 'MALE' : 'FEMALE',
    age: typeof userData.age === 'string' ? parseInt(userData.age) : userData.age,
    mbti: userData.mbti,
  });

  formData.append('userInfo', {
    uri: 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(userInfoJson))),
    type: 'application/json',
    name: 'userInfo.json',
  });

  // ✅ 새 이미지가 선택된 경우에만 파일 전송
  if (image?.uri) {
    // 💡 Base64 인코딩된 이미지 크기 로그 (전송 직전!)
    if (image.uri.startsWith('data:image')) {
      const base64String = image.uri.split(',')[1];
      const size = Math.floor((base64String.length * 3) / 4);
      console.log('📏 [전송 Base64 이미지 용량] ' + size + ' bytes ≈ ' + (size / 1024).toFixed(1) + ' KB');
    } else if (image.uri.startsWith('file://')) {
      // [UPDATED] 구버전 getInfoAsync → 최신 File API로 교체
      const file = new File(image.uri);
      const info = await file.getInfo();
      console.log('📏 [원본 파일 용량] ' + info.size + ' bytes ≈ ' + (info.size / 1024).toFixed(1) + ' KB');
    }

    formData.append('profileImage', {
      uri: image.uri,
      name: image.name || 'profile.jpg',
      type: image.type?.includes('image') ? 'image/jpeg' : image.type || 'image/jpeg',
    });
  }

  // ✅ 디버깅 로그
  console.log('📦 전송할 FormData 항목들:');
  try {
    // RN FormData.entries는 환경에 따라 없을 수 있음
    if (formData?.entries) {
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, typeof value === 'object' ? value.uri || '[object]' : value);
      }
    }
  } catch {}

  try {
    const response = await fetch(`${BASE_URL}/user/edit`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (!response.ok) {
      console.error('❌ 프로필 수정 실패:', response.status, text);
      throw new Error(text); // 에러 메시지 body
    }
    console.log('🟦 [프로필 편집 요청] JWT 토큰:', token);
    console.log('🟦 [프로필 편집 요청] fetch headers:', {
      Authorization: `Bearer ${token}`,
    });
    console.log('✅ 프로필 수정 성공:', data);
    return data;
  } catch (error) {
    console.error('❌ 네트워크 오류 발생:', error.message);
    throw error;
  }
};


// 프로필 편집시, DB에서 받아온 사진 URL을 파일로 바꿔 DB로 다시 전송함
/**
 * 이미지 URL을 React Native용 FormData 호환 이미지 객체로 변환
 * - uri: 이미지 URL
 * - type: 기본 'image/jpeg'
 * - name: 기본 'profile.jpg'
 *
 * @param {string} imageUrl - 기존 이미지 URL
 * @returns {Object} FormData에 넣을 수 있는 이미지 객체
 */
// (현재는 urlToBase64ProfileImage만 사용)
// export const convertUrlToImageObject = (imageUrl) => {
//   return {
//     uri: imageUrl,
//     type: 'image/jpeg',     // 필요시 image/png 등으로 수정 가능
//     name: 'profile.jpg',
//   };
// };

export async function urlToBase64ProfileImage(url) {
  const filename = 'profile_from_url.jpg'; // 변환한 사진고정.

  // [UPDATED] createDownloadResumable → 최신 DownloadResumable 생성자 사용
  const downloadResumable = new DownloadResumable(
    url,
    Directory.cache + filename // [UPDATED] 최신 Directory 사용
  );

  const { uri } = await downloadResumable.downloadAsync();
  // console.log('✅ [이미지 다운로드 성공] 로컬 파일 경로:', uri);

  // [UPDATED] readAsStringAsync + EncodingType 사용
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  // console.log('✅ [base64 인코딩 성공] base64 앞 80자:', base64.slice(0, 80));

  const obj = {
    uri: `data:image/jpeg;base64,${base64}`,
    name: filename,
    type: 'image/jpeg',
  };
  // console.log('✅ [최종 변환 파일 객체] :', obj);

  return obj;
}


// // 적용 예시 (editUserProfileWithFetch 호출 전에)
// let imageParam = null;

// if (typeof profileImage === 'string') {
//   // 기존 이미지 URL인 경우
//   imageParam = convertUrlToImageObject(profileImage);
// } else if (profileImage?.uri) {
//   // 사용자가 새로 선택한 이미지인 경우
//   imageParam = profileImage;
// }

// await editUserProfileWithFetch(userData, imageParam, token);
