import { el } from "@webtaku/el";
import { fetchProfile, setProfile } from "../api/profile";
import { profileService } from "../services/profile";
export function createProfileFormModal(address, token) {
    const modal = el('ion-modal');
    const nicknameInput = el('ion-input', {
        placeholder: '닉네임',
        value: '',
        label: '닉네임',
        labelPlacement: 'stacked'
    });
    const bioInput = el('ion-textarea', {
        placeholder: '자기소개',
        value: '',
        label: '자기소개',
        labelPlacement: 'stacked'
    });
    const saveBtn = el('ion-button', { expand: 'block', disabled: true }, '저장하기');
    // 현재 프로필 불러오기
    fetchProfile(address).then(profile => {
        nicknameInput.value = profile.nickname ?? '';
        bioInput.value = profile.bio ?? '';
        saveBtn.disabled = false;
    }).catch(err => {
        console.error(err);
        saveBtn.disabled = true;
    });
    saveBtn.onclick = async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = ''; // 초기화
        saveBtn.append(el('ion-spinner', { name: 'crescent' }));
        try {
            const nickname = nicknameInput.value?.toString() || '';
            const bio = bioInput.value?.toString() || '';
            await setProfile({ nickname, bio }, token);
            // 🔷 프로필 서비스 캐시도 갱신 + 이벤트 발생
            profileService.setProfile(address, nickname, bio);
            // 🔷 토스트로 알림
            const toast = document.createElement('ion-toast');
            toast.message = '프로필이 저장되었습니다!';
            toast.duration = 2000;
            toast.color = 'success';
            document.body.appendChild(toast);
            toast.present();
            modal.dismiss(); // 닫기
        }
        catch (err) {
            console.error(err);
            saveBtn.textContent = '실패';
            setTimeout(() => {
                saveBtn.textContent = '저장하기';
            }, 2000);
        }
        finally {
            saveBtn.disabled = false;
        }
    };
    const modalHeader = el('ion-header', el('ion-toolbar', el('ion-title', '프로필 편집'), el('ion-buttons', { slot: 'end' }, el('ion-button', { onclick: () => modal.dismiss() }, '닫기'))));
    const modalContent = el('ion-content.ion-padding', el('ion-list', nicknameInput, bioInput, saveBtn));
    modal.append(modalHeader, modalContent);
    return modal;
}
//# sourceMappingURL=profile-form.js.map