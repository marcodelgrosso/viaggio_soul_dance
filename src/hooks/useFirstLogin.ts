// Hook per tracciare i primi login
export interface FirstLogin {
  user: string;
  date: string;
  timestamp: string;
  time: string;
}

export function useFirstLogin() {
  const trackFirstLogin = (userCode: string): void => {
    try {
      const today = new Date().toDateString();
      const firstLogins = JSON.parse(localStorage.getItem('firstLogins') || '[]');

      const userFirstLoginKey = `hasLoggedIn_${userCode}`;
      const userHasLoggedIn = localStorage.getItem(userFirstLoginKey);

      if (!userHasLoggedIn) {
        localStorage.setItem(userFirstLoginKey, 'true');

        const alreadyExists = firstLogins.some(
          (login: FirstLogin) => login.date === today && login.user === userCode
        );

        if (!alreadyExists) {
          firstLogins.push({
            user: userCode,
            date: today,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString('it-IT'),
          });

          localStorage.setItem('firstLogins', JSON.stringify(firstLogins));
          console.log('✅ Primo login tracciato per:', userCode);
        }
      }
    } catch (error) {
      console.error('Errore nel tracciamento del primo login:', error);
    }
  };

  const getTodayFirstLogins = (): FirstLogin[] => {
    try {
      const today = new Date().toDateString();
      const firstLogins = JSON.parse(localStorage.getItem('firstLogins') || '[]');
      const todayLogins = firstLogins.filter((login: FirstLogin) => login.date === today);

      todayLogins.sort((a: FirstLogin, b: FirstLogin) => {
        if (a.timestamp && b.timestamp) {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        }
        return 0;
      });

      return todayLogins;
    } catch (error) {
      console.error('Errore nel recupero dei primi login:', error);
      return [];
    }
  };

  const cleanupOldFirstLogins = (): void => {
    try {
      const today = new Date().toDateString();
      const firstLogins = JSON.parse(localStorage.getItem('firstLogins') || '[]');
      const todayLogins = firstLogins.filter((login: FirstLogin) => login.date === today);
      localStorage.setItem('firstLogins', JSON.stringify(todayLogins));
    } catch (error) {
      console.error('Errore nella pulizia dei primi login:', error);
    }
  };

  return {
    trackFirstLogin,
    getTodayFirstLogins,
    cleanupOldFirstLogins,
  };
}


