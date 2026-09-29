# Rewrite benchmark

| Model | Cases with a variant shown | Variants kept | Median latency |
|---|---|---|---|
| gemma4:e2b-it-qat | 10/10 | 30/30 | 1.62s |
| qwen3.5:4b | 10/10 | 30/30 | 2.69s |

### 1. `Je pense qu'il faudrait qu'on se voie la semaine prochaine pour en discuter parce que sinon on va encore perdre du temps sur des sujets qui ont déjà été tranchés la dernière fois et ça commence à faire beaucoup de réunions pour pas grand chose au final.`

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Je pense que nous devrions nous voir la semaine prochaine pour en discuter, car sinon nous allons encore perdre du temps sur des sujets qui ont déjà été tranchés la dernière fois, et cela commence à faire beaucoup de réunions pour peu de choses au final. | ✓ |
| gemma4:e2b-it-qat | Il faudrait que nous nous voyions la semaine prochaine pour en parler. Sinon, nous allons encore perdre du temps sur des sujets déjà décidés la dernière fois, et cela devient une série de réunions inutiles. | ✓ |
| gemma4:e2b-it-qat | Je suggère que nous nous rencontrions la semaine prochaine pour en discuter. Sinon, nous risquons de perdre encore du temps sur des points déjà réglés la dernière fois, ce qui transforme nos réunions en quelque chose de peu productif. | ✓ |
| qwen3.5:4b | Je pense qu'il serait préférable de nous voir la semaine prochaine pour en discuter, car sinon nous perdrons encore du temps sur des sujets déjà tranchés lors de la dernière réunion. Cela commence à faire beaucoup de réunions sans grand résultat. | ✓ |
| qwen3.5:4b | Il faudrait que nous nous voyions la semaine prochaine afin d'en discuter ; autrement, nous continuerons à perdre du temps sur des points déjà réglés la dernière fois. Nous risquons ainsi de multiplier les réunions pour peu de résultats. | ✓ |
| qwen3.5:4b | Je suggère de nous rencontrer la semaine prochaine pour en parler, car sinon nous gaspillons encore du temps sur des sujets déjà tranchés lors de la dernière séance. Cela devient trop de réunions pour un résultat significatif. | ✓ |

### 2. `Could you please let me know if you have had the chance to look at the document I sent you last Tuesday because we need to send it to the client before the 15th.`

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Have you had a chance to review the document I sent you last Tuesday? We need to send it to the client before the 15th. | ✓ |
| gemma4:e2b-it-qat | Please let me know if you have looked at the document I sent last Tuesday. We must send it to the client before the 15th. | ✓ |
| gemma4:e2b-it-qat | Could you confirm if you have reviewed the document I sent last Tuesday? We need to submit it to the client before the 15th. | ✓ |
| qwen3.5:4b | Could you please confirm whether you have reviewed the document I sent on last Tuesday, as we need to submit it to the client by the 15th? | ✓ |
| qwen3.5:4b | Please let me know if you've had a chance to look at the document I sent last Tuesday, since we must send it to the client before the 15th. | ✓ |
| qwen3.5:4b | I was wondering if you have reviewed the document I sent on last Tuesday, as we need to deliver it to the client prior to the 15th. | ✓ |

### 3. `On a déployé la v2.3 sur https://app.sencrop.com hier soir et depuis Paul a remarqué que les alertes arrivent avec 10 minutes de retard.`

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Nous avons déployé la version 2.3 sur https://app.sencrop.com hier soir, et depuis, Paul a remarqué que les alertes arrivent avec un retard de 10 minutes. | ✓ |
| gemma4:e2b-it-qat | La v2.3 a été déployée sur https://app.sencrop.com hier soir. Depuis, Paul a constaté que les alertes arrivent avec un retard de 10 minutes. | ✓ |
| gemma4:e2b-it-qat | Hier soir, nous avons déployé la v2.3 sur https://app.sencrop.com. Depuis ce déploiement, Paul a remarqué que les alertes sont arrivées avec un retard de 10 minutes. | ✓ |
| qwen3.5:4b | On a déployé la version 2.3 sur https://app.sencrop.com ce soir, et Paul a constaté que les alertes sont désormais parues avec un délai de dix minutes. | ✓ |
| qwen3.5:4b | Au cours de la soirée, le déploiement de la v2.3 sur https://app.sencrop.com a été effectué ; depuis lors, Paul observe que les alertes arrivent avec 10 minutes de retard. | ✓ |
| qwen3.5:4b | La version 2.3 a été déployée sur https://app.sencrop.com hier soir. Depuis, Paul remarque que les alertes sont parues avec un délai de dix minutes. | ✓ |

### 4. `I wanted to ask you if maybe it would be possible for you to send me the report when you have some time.`

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Could you please send me the report when you have some time? | ✓ |
| gemma4:e2b-it-qat | Would it be possible for you to send me the report when you have a moment? | ✓ |
| gemma4:e2b-it-qat | When you have time, could you send me the report? | ✓ |
| qwen3.5:4b | Could you please send me the report whenever you have a moment? | ✓ |
| qwen3.5:4b | Would it be possible for you to share the report at your earliest convenience? | ✓ |
| qwen3.5:4b | Please let me know when you can send over the report. | ✓ |

### 5. `Suite à notre échange de ce matin, je vous confirme que la livraison des 250 capteurs est prévue le 3 octobre à Lyon, sous réserve de validation du bon de commande par Marie.`

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Suite à notre conversation de ce matin, je vous confirme que la livraison des 250 capteurs est prévue le 3 octobre à Lyon, sous réserve que Marie valide le bon de commande. | ✓ |
| gemma4:e2b-it-qat | Comme convenu lors de notre échange de ce matin, la livraison des 250 capteurs aura lieu le 3 octobre à Lyon, à condition que Marie valide le bon de commande. | ✓ |
| gemma4:e2b-it-qat | Pour faire suite à notre discussion de ce matin, je vous confirme que la livraison des 250 capteurs est fixée au 3 octobre à Lyon, sous réserve de la validation du bon de commande par Marie. | ✓ |
| qwen3.5:4b | Suite à notre échange de ce matin, je vous confirme que les 250 capteurs seront livrés le 3 octobre à Lyon, sous réserve de la validation du bon de commande par Marie. | ✓ |
| qwen3.5:4b | Comme convenu ce matin, la livraison des 250 capteurs est prévue pour le 3 octobre à Lyon, conditionnée par la validation du bon de commande de la part de Marie. | ✓ |
| qwen3.5:4b | En réponse à notre discussion d'aujourd'hui, je vous confirme que les 250 capteurs arriveront à Lyon le 3 octobre, à condition que Marie valide le bon de commande. | ✓ |

### 6. `Thanks for the update, I will have a look at it tomorrow morning and get back to you with my comments before the end of the day.`

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Thank you for the update. I will review it tomorrow morning and provide my comments before the end of the day. | ✓ |
| gemma4:e2b-it-qat | I appreciate the update. I plan to look it over tomorrow morning and will get back to you with my feedback by the end of the day. | ✓ |
| gemma4:e2b-it-qat | Thanks for letting me know. I will examine it tomorrow morning and send you my comments before the day is over. | ✓ |
| qwen3.5:4b | Thank you for the update. I will review it first thing tomorrow morning and send my comments back to you by the end of the day. | ✓ |
| qwen3.5:4b | Thanks for sending this over. I'll take a look at it tomorrow morning and get your feedback before closing out today. | ✓ |
| qwen3.5:4b | I appreciate the update. I plan to examine it early tomorrow morning and return with my comments before the day ends. | ✓ |

### 7. `voulais te demander si jamais tu avais le temps de regarder`

In: Merci pour ton retour. Je voulais te demander si jamais tu avais le temps de regarder le document que je t'ai envoyé mardi.

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | voulais te demander si jamais tu avais le temps de consulter | ✓ |
| gemma4:e2b-it-qat | voulais te demander si jamais tu avais un moment pour regarder | ✓ |
| gemma4:e2b-it-qat | voulais te demander si jamais tu avais l'occasion de regarder | ✓ |
| qwen3.5:4b | voulais te demander si tu avais le temps de regarder | ✓ |
| qwen3.5:4b | souhaitais savoir si tu avais le temps de regarder | ✓ |
| qwen3.5:4b | voulais te demander si tu pouvais prendre le temps de regarder | ✓ |

### 8. `it would be really good if we could maybe try to`

In: I think it would be really good if we could maybe try to ship the release on Friday.

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | we could try to | ✓ |
| gemma4:e2b-it-qat | we could attempt to | ✓ |
| gemma4:e2b-it-qat | we could endeavor to | ✓ |
| qwen3.5:4b | I think it would be really good if we could try | ✓ |
| qwen3.5:4b | I think it would be great if we could try | ✓ |
| qwen3.5:4b | I think it would be beneficial if we could try | ✓ |

### 9. `Le build plante à chaque fois que je lance les tests unitaires sur la branche feature/login`

In: Le build plante à chaque fois que je lance les tests unitaires sur la branche feature/login, du coup je ne peux pas merger la PR.

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | Le build échoue systématiquement lors de l'exécution des tests unitaires sur la branche feature/login | ✓ |
| gemma4:e2b-it-qat | Le build plante à chaque tentative d'exécution des tests unitaires sur la branche feature/login | ✓ |
| gemma4:e2b-it-qat | Le build rencontre une erreur à chaque lancement des tests unitaires sur la branche feature/login | ✓ |
| qwen3.5:4b | car le build échoue systématiquement lors de l'exécution des tests unitaires sur la branche feature/login | ✓ |
| qwen3.5:4b | puisque le build plante à chaque lancement des tests unitaires sur la branche feature/login | ✓ |
| qwen3.5:4b | en effet, le build plante dès que je lance les tests unitaires sur la branche feature/login | ✓ |

### 10. `schedule a call with Anna and the team next week`

In: We should probably schedule a call with Anna and the team next week to go over the Q3 numbers.

| Model | Variant | Result |
|---|---|---|
| gemma4:e2b-it-qat | arrange a meeting with Anna and the team next week | ✓ |
| gemma4:e2b-it-qat | set up a call with Anna and the team next week | ✓ |
| gemma4:e2b-it-qat | organize a call with Anna and the team next week | ✓ |
| qwen3.5:4b | We should probably schedule a call with Anna and the team next week to go over the Q3 numbers | ✓ |
| qwen3.5:4b | We should probably set up a call with Anna and the team next week to go over the Q3 numbers | ✓ |
| qwen3.5:4b | We should probably arrange a call with Anna and the team next week to go over the Q3 numbers | ✓ |
