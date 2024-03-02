!include MUI2.nsh

!macro customUnInstall
    MessageBox MB_YESNO|MB_ICONQUESTION "Would you like to delete user data as well? This action will erase all saved movies and your OMDB API key. If you intend to reinstall this application later, please refrain from removing user data." IDYES deleteUserData
    Goto end
    deleteUserData:
        RMDir /r "$APPDATA\movie-collection-visualizer"
    end:
!macroend