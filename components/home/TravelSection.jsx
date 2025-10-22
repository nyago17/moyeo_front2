// components/home/TravelSection.jsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  PixelRatio,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import TravelCard from '../common/TravelCard';

// ==== 반응형 유틸 함수 (iPhone 13 기준) ====
// (원본 유지)
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale =
    based === 'height'
      ? SCREEN_HEIGHT / BASE_HEIGHT
      : SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

/**
 * 다가오는 여행 카드 리스트를 출력하는 컴포넌트입니다.
 */
export default function TravelSection({ travelList = [], onPressCreate, onPressCard }) {
  const safeList = Array.isArray(travelList) ? travelList : [];

  const isEmpty = (safeList?.length ?? 0) === 0;

  return (
    <View style={styles.container}>
      {isEmpty ? (
        // [UPDATED] 빈 상태: 점선 박스 + 내부 중앙 보라 CTA (onPress는 기존 그대로)
        <View style={styles.emptyCard}>
          <View style={styles.emptyTextWrap}>
            <Text style={styles.emptyTitle}>아직 여행 플랜이 없어요</Text>
            <Text style={styles.emptySub}>함께 여행계획을 세우러 가볼까요?</Text>
          </View>

          <TouchableOpacity style={styles.ctaButton} onPress={onPressCreate}>
            <View style={styles.ctaIconBox}>
              <MaterialIcons name="add" size={normalize(12)} color="#FFFFFF" />
            </View>
            <Text style={styles.ctaLabel}>여행 플랜 만들기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        safeList.map(plan => (
          <TravelCard
            key={plan.id}
            title={plan.title}
            period={
              plan.startDate && plan.endDate
                ? `${plan.startDate.replace(/-/g, '.')} ~ ${plan.endDate.replace(/-/g, '.')}`
                : plan.period || ''
            }
            dDay={plan.dDay || plan.dday || ''}
            route={Array.isArray(plan.route) ? plan.route : []}
            onPress={() => {
              console.log('✅ TravelCard 클릭됨! plan.id:', plan.id);
              onPressCard?.(plan.id);
            }}
          />
        ))
      )}

      {/* [UPDATED] 시안에서는 빈 상태일 때 내부 CTA만 보임.
          기존 '항상 하단 버튼'은 유지 가능하지만, 시안과 맞추기 위해
          빈 상태가 아닐 때만 하단 버튼을 노출하도록 처리 (기능 동일). */}
      {!isEmpty && (
        <TouchableOpacity style={styles.createBtn} onPress={onPressCreate}>
          <View style={styles.plusCircle}>
            <MaterialIcons name="add" size={normalize(20)} color="#FFFFFF" />
          </View>
          <Text style={styles.createText}>여행 플랜 만들러 가기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: normalize(0, 'height'),
    paddingHorizontal: normalize(20), // [UPDATED] 좌우 20 기준
  },

  // ===== Empty State (시안 적용) =====
  emptyCard: {
    // [UPDATED] dashed 1px #D3D3DE, radius 12, paddingV 32, 가운데 정렬
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3D3DE',
    borderStyle: 'dashed',
    borderRadius: normalize(12),
    paddingVertical: normalize(32, 'height'),
    alignItems: 'center',
    justifyContent: 'center',
    gap: normalize(20, 'height'),
  },
  emptyTextWrap: {
    gap: normalize(4, 'height'),
    width: '100%',
    alignItems: 'center',
  },
  emptyTitle: {
    // 16/500/#141414 center
    fontSize: normalize(16),
    fontFamily: 'Inter_600SemiBold',
    color: '#141414',
    textAlign: 'center',
    letterSpacing: normalize(-0.4),
  },
  emptySub: {
    // 14/400/#767676 center
    fontSize: normalize(14),
    fontFamily: 'Inter_400Regular',
    color: '#767676',
    textAlign: 'center',
    letterSpacing: normalize(-0.35),
  },
  ctaButton: {
    // [NEW] 내부 보라 CTA 141x40, radius 12, 가로 중앙
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: normalize(40, 'height'),
    paddingVertical: normalize(10, 'height'),
    paddingHorizontal: normalize(16),
    gap: normalize(4),
    backgroundColor: '#4F46E5',
    borderRadius: normalize(12),
  },
  ctaIconBox: {
    width: normalize(20),
    height: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLabel: {
    // 14/500/#FFFFFF
    fontSize: normalize(14),
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: normalize(-0.35),
  },

  // ===== 기존 리스트 하단 CTA (빈 상태 아닐 때) =====
  createBtn: {
    width: '100%',
    height: normalize(48, 'height'),
    borderRadius: normalize(20),
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: normalize(6),
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: normalize(36),
    marginTop: normalize(18, 'height'),
    alignSelf: 'center',
  },
  plusCircle: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(14),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: normalize(12),
  },
  createText: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: normalize(16),
    color: '#000000',
    textAlign: 'center',
    flex: 1,
    paddingRight: normalize(36),
  },
});
