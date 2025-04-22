*** Keywords ***


Siirry kalenteriin ja valitse päivä
    [Arguments]    ${pvm}
    Sleep   2s
    Click With Options    selector=[data-date="${pvm}"]    clickCount=2


Tee uusi merkintä
    Sleep   2s
    Type Text       id=morningValue       6.5   delay=0.5s
    Type Text       id=eveningValue       8.7   delay=0.5s
    Type Text       id=snackBefore       11.2   delay=0.5s
    Type Text       id=snackAfter       8.4     delay=0.5s

Tallenna merkintä
    Sleep   0.1s
    Click       id=saveButton

Muokkaa merkintää
    Sleep   1s
    Fill Text    id=snackBefore    9.2
    Sleep   0.5s
    Fill Text    id=comment        Lisätään kommentti robot testaukseen
    Sleep   0.5s
    Click        id=saveButton

Poista merkintä
    Click    id=deleteButton
    Sleep   1s

Hae HRV-data ja tallenna
    Click   id=fetchHrvButton
    Sleep   2s
    Click   id=saveButton
    Sleep   1s


    





    



