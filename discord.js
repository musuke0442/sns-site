// Lanyard APIでDiscordプレゼンス情報を取得
class DiscordStatusManager {
    constructor() {
        this.userId = '772268153370968117';
        this.statusElement = null;
        this.activityElement = null;
        this.avatarElement = null;
        this.updateInterval = null;
        this.lastStatus = null;
        this.lastActivity = null;

        this.initializeElements();
        this.initializeStatus();
    }

    initializeElements() {
        this.statusElement = document.getElementById('discordStatus');
        this.activityElement = document.getElementById('discordActivity');
        this.avatarElement = document.getElementById('discordAvatar');
        this.profileElement = document.getElementById('discordProfile');
    }

    async initializeStatus() {
        await this.fetchDiscordStatus();
        this.startAutoUpdate();
    }

    async fetchDiscordStatus() {
        try {
            const response = await fetch(`https://api.lanyard.rest/v1/users/${this.userId}`);
            const data = await response.json();

            if (data.success && data.data) {
                this.updateDiscordDisplay(data.data);
                this.checkForStatusChange(data.data);
            } else {
                this.showOfflineStatus();
            }
        } catch (error) {
            console.error('Discordステータス取得エラー:', error);
            this.showOfflineStatus();
        }
    }

    updateDiscordDisplay(data) {
        const { discord_user, discord_status, activities } = data;

        // アバター画像を更新（正しいパスから取得）
        if (this.avatarElement && discord_user && discord_user.avatar) {
            const avatarUrl = `https://cdn.discordapp.com/avatars/${this.userId}/${discord_user.avatar}.png?size=128`;
            this.avatarElement.src = avatarUrl;
            this.avatarElement.style.display = 'block';

            // 画像の読み込みエラーハンドリング
            this.avatarElement.onerror = () => {
                this.avatarElement.src = 'https://via.placeholder.com/80x80/4A90E2/FFFFFF?text=D';
                this.avatarElement.style.display = 'block';
                this.profileElement.classList.remove('center-content');
            };

            // 画像読み込み成功時の処理
            this.avatarElement.onload = () => {
                this.avatarElement.style.display = 'block';
                this.profileElement.classList.remove('center-content');
            };
        } else {
            // アバターがない場合はプレースホルダーを表示
            this.avatarElement.src = 'https://via.placeholder.com/80x80/4A90E2/FFFFFF?text=D';
            this.avatarElement.style.display = 'block';
            this.profileElement.classList.remove('center-content');
        }

        // ステータスに応じた色を設定
        const statusColors = {
            online: '#23a55a',
            idle: '#f0b232',
            dnd: '#f23f43',
            offline: '#80848e'
        };

        // アクティビティ情報を更新
        if (activities && activities.length > 0) {
            const activity = activities[0];
            this.updateActivityDisplay(activity);
        } else {
            this.clearActivityDisplay();
        }

        // ステータス表示を更新
        this.updateStatusDisplay(discord_status, statusColors);
    }

    updateActivityDisplay(activity) {
        if (this.activityElement) {
            let activityText = '';

            switch (activity.type) {
                case 0: // ゲーム
                    activityText = `🎮 ${activity.name}${activity.details ? ' - ' + activity.details : ''}`;
                    break;
                case 1: // ストリーミング
                    activityText = `🔴 ${activity.name}${activity.details ? ' - ' + activity.details : ''}`;
                    break;
                case 2: // 音楽（Spotifyなど）
                    activityText = `🎵 ${activity.name}${activity.details ? ' - ' + activity.details : ''}`;
                    break;
                case 3: // チーム参加
                    activityText = `👥 ${activity.name}${activity.details ? ' - ' + activity.details : ''}`;
                    break;
                case 5: // 競技
                    activityText = `🏆 ${activity.name}${activity.details ? ' - ' + activity.details : ''}`;
                    break;
                default:
                    activityText = `📱 ${activity.name}${activity.details ? ' - ' + activity.details : ''}`;
            }

            this.activityElement.textContent = activityText;
            this.activityElement.style.display = 'block';
        }
    }

    clearActivityDisplay() {
        if (this.activityElement) {
            this.activityElement.textContent = '';
            this.activityElement.style.display = 'none';
        }
    }

    centerProfileContent() {
        if (this.profileElement) {
            this.profileElement.classList.add('center-content');
        }
    }

    updateStatusDisplay(status, statusColors) {
        if (this.statusElement) {
            const statusText = {
                online: 'Online',
                idle: 'Away',
                dnd: 'Busy',
                offline: 'Offline'
            };

            this.statusElement.textContent = statusText[status] || 'Unknown';
            this.statusElement.style.color = statusColors[status] || '#80848e';
        }
    }

    checkForStatusChange(data) {
        const { discord_status, activities } = data;
        const currentStatus = discord_status;
        const currentActivity = activities && activities.length > 0 ? activities[0] : null;

        // 初回チェック以外でステータスが変更された場合
        if (this.lastStatus !== null && this.lastStatus !== currentStatus) {
            this.showStatusChangeNotification(currentStatus);
        }

        // 初回チェック以外でアクティビティが変更された場合
        if (this.lastActivity !== null && JSON.stringify(this.lastActivity) !== JSON.stringify(currentActivity)) {
            this.showActivityChangeNotification(currentActivity);
        }

        // 現在の状態を保存
        this.lastStatus = currentStatus;
        this.lastActivity = currentActivity;
    }

    showStatusChangeNotification(newStatus) {
        if (!window.simpleNotificationManager || !window.simpleNotificationManager.isGranted) return;

        const statusMessages = {
            online: 'musukeがオンラインになりました',
            idle: 'musukeが離席中になりました',
            dnd: 'musukeが取り込み中になりました',
            offline: 'musukeがオフラインになりました'
        };

        const message = statusMessages[newStatus] || `musukeのステータスが${newStatus}になりました`;

        window.simpleNotificationManager.showNotification(message, {
            body: 'Discordのステータスが変更されました',
            icon: '/favicon.ico',
            tag: 'discord-status-change'
        });
    }

    showActivityChangeNotification(newActivity) {
        if (!window.simpleNotificationManager || !window.simpleNotificationManager.isGranted) return;

        if (!newActivity) {
            window.simpleNotificationManager.showNotification('musukeのアクティビティが終了しました', {
                body: 'Discordで何も表示されなくなりました',
                icon: '/favicon.ico',
                tag: 'discord-activity-change'
            });
            return;
        }

        let activityMessage = '';
        switch (newActivity.type) {
            case 0: // ゲーム
                activityMessage = `musukeが「${newActivity.name}」をプレイし始めました`;
                break;
            case 1: // ストリーミング
                activityMessage = `musukeが「${newActivity.name}」を配信し始めました`;
                break;
            case 2: // 音楽
                activityMessage = `musukeが「${newActivity.name}」を聴き始めました`;
                break;
            case 3: // チーム参加
                activityMessage = `musukeが「${newActivity.name}」に参加しました`;
                break;
            case 5: // 競技
                activityMessage = `musukeが「${newActivity.name}」で競技し始めました`;
                break;
            default:
                activityMessage = `musukeが「${newActivity.name}」を始めました`;
        }

        window.simpleNotificationManager.showNotification(activityMessage, {
            body: 'Discordのアクティビティが変更されました',
            icon: '/favicon.ico',
            tag: 'discord-activity-change'
        });
    }

    showOfflineStatus() {
        if (this.statusElement) {
            this.statusElement.textContent = 'Offline';
            this.statusElement.style.color = '#80848e';
        }
        this.clearActivityDisplay();
    }

    startAutoUpdate() {
        // 30秒ごとにステータスを更新
        this.updateInterval = setInterval(() => {
            this.fetchDiscordStatus();
        }, 30000);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
