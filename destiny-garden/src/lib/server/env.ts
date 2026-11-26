/** 운영(strict) 모드: 비밀키 필수, 오프라인 AI·가상 결제 금지. DG_STAGING=1 이면 production 빌드에서도 테스트 모드를 허용한다. */
export const strictProd = () => process.env.NODE_ENV === 'production' && process.env.DG_STAGING !== '1';
