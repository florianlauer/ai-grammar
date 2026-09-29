# Tone benchmark

Presets: kept variants that reach the preset's goal, out of the variants that passed the extension's checks.

| Model | Meter exact | Meter within one | Meter latency | formal | friendly | confident | shorter | natural | natural, correct |
|---|---|---|---|---|---|---|---|---|---|
| gemma4:e2b-it-qat | 10/12 | 12/12 | 0.30s | 11/11 | 12/12 | 12/12 | 11/11 | 12/12 | 11/11 |
| qwen3.5:4b | 9/12 | 12/12 | 0.67s | 11/12 | 12/12 | 12/12 | 12/12 | 12/12 | 11/12 |

| Model | Set | Text or variant | Expected | Result |
|---|---|---|---|---|
| gemma4:e2b-it-qat | meter | yo t'es chaud pour un kebab ce soir ou quoi | 1 | 1 |
| gemma4:e2b-it-qat | meter | lol ok np, ttyl | 1 | 1 |
| gemma4:e2b-it-qat | meter | salut, tu peux me renvoyer le doc stp ? | 2 | 2 |
| gemma4:e2b-it-qat | meter | hey, can you send me the file when you get a sec? | 2 | 2 |
| gemma4:e2b-it-qat | meter | Bonjour, pouvez-vous me renvoyer le document ? Merci. | 3 | 4 |
| gemma4:e2b-it-qat | meter | Hi Paul, could you send me the report before Friday? Thanks. | 3 | 2 |
| gemma4:e2b-it-qat | meter | The meeting is scheduled for next Thursday. | 3 | 3 |
| gemma4:e2b-it-qat | meter | Le déploiement est prévu pour jeudi prochain. | 3 | 3 |
| gemma4:e2b-it-qat | meter | Bonjour Madame, pourriez-vous me transmettre le document avant vendredi ? Je vous remercie par avance. | 4 | 4 |
| gemma4:e2b-it-qat | meter | Dear Mr. Smith, could you please send me the signed contract at your earliest convenience? | 4 | 4 |
| gemma4:e2b-it-qat | meter | Madame la Directrice, je vous prie d'agréer l'expression de mes salutations distinguées. | 5 | 5 |
| gemma4:e2b-it-qat | meter | We hereby acknowledge receipt of your correspondence dated 3 October and shall respond in due course. | 5 | 5 |
| gemma4:e2b-it-qat | formal | Bonjour, je me permets de vous demander si vous auriez la possibilité de jeter un œil à mon document avant jeudi. Dans le cas contraire, cela ne pose aucun problème. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | Bonjour, je souhaiterais savoir s'il vous serait possible de prendre connaissance de mon document avant jeudi. Si cela n'est pas possible, je vous remercie de votre compréhension. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | I would like to inquire whether it would be possible to reschedule our call to Friday at 3:00 PM. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | Could you please advise if moving our scheduled call to Friday at 3:00 PM is feasible? | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | I am writing to ascertain the possibility of adjusting our call time to Friday at 3:00 PM. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | Je suggère que nous puissions envisager de livrer la version 2.4 vendredi, sous réserve de l'accord de Paul. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | Il me semble envisageable de procéder à la livraison de la version 2.4 ce vendredi, si Paul donne son approbation. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | Nous pourrions potentiellement tenter de livrer la version 2.4 vendredi, à condition que Paul soit d'accord. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | I propose that we proceed with the second option, as it appears to be more cost-effective. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | It is my recommendation that we select the second option, given its potentially lower cost. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | formal | I suggest we opt for the second option, as it seems to offer a more economical choice. | sounds more formal | ✓ |
| gemma4:e2b-it-qat | friendly | Bonjour, je voulais simplement savoir si tu aurais peut-être un moment pour regarder mon document avant jeudi. Si ce n'est pas possible, ce n'est absolument pas grave. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Salut, j'aimerais savoir si tu aurais la possibilité de jeter un œil à mon document avant jeudi. Si tu es débordé(e), ne t'inquiète pas. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Bonjour, je me demandais si tu aurais un peu de temps pour consulter mon document avant jeudi. Si tu n'es pas disponible, ce n'est pas un problème du tout. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Hello, I was wondering if you might be open to rescheduling our call to Friday at 3pm? | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Hi there, I wanted to gently inquire if moving our call to Friday at 3pm might work for you? | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Good day, I was hoping to see if it would be possible to adjust our call to Friday at 3pm? | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Je me permets de suggérer que nous pourrions envisager de livrer la version 2.4 vendredi, si Paul est d'accord. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Il me semble que nous pourrions peut-être tenter de livrer la version 2.4 vendredi, si Paul est d'accord. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Je pensais que nous pourrions peut-être essayer de livrer la version 2.4 vendredi, si Paul est d'accord. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | I think we might want to go with the second option; it appears to be a bit more budget-friendly. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | Perhaps the second option would be a better choice for us, as it seems to be a little more economical. | passes the checks | ✓ |
| gemma4:e2b-it-qat | friendly | I lean toward the second option, as it looks like it might be a bit more cost-effective. | passes the checks | ✓ |
| gemma4:e2b-it-qat | confident | Salut, regarde mon document avant jeudi. Pas de problème sinon. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | Tu peux regarder mon document avant jeudi. C'est bon sinon. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | J'ai besoin que tu regardes mon document avant jeudi. Sinon, ce n'est pas grave. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | Can we move our call to Friday at 3pm? | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | I need to move our call to Friday at 3pm. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | Let's move our call to Friday at 3pm. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | Nous livrerons la version 2.4 vendredi si Paul est d'accord. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | Nous allons livrer la version 2.4 vendredi, sous réserve de l'accord de Paul. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | La livraison de la version 2.4 aura lieu vendredi, si Paul donne son accord. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | We should go with the second option; it is cheaper. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | The second option is the better choice because it is cheaper. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | confident | Choose the second option; it is cheaper. | fewer hedges | ✓ |
| gemma4:e2b-it-qat | shorter | Peux-tu regarder mon doc avant jeudi ? | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Tu as le temps de regarder mon doc avant jeudi ? | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Can we move our call to Friday at 3pm? | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Could we reschedule our call for Friday at 3pm? | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Is Friday at 3pm possible for our call? | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Essayons de livrer la version 2.4 vendredi si Paul est d'accord. | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Livrer la version 2.4 vendredi si Paul est d'accord. | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Version 2.4 vendredi si Paul est d'accord. | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | The second option seems cheaper. | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | Let's go with the second option; it appears cheaper. | fewer words | ✓ |
| gemma4:e2b-it-qat | shorter | The second option is likely cheaper. | fewer words | ✓ |
| gemma4:e2b-it-qat | natural | I have actually been working on this project for two weeks, and I will send you the schedule eventually. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | In fact, I've been working on this project for two weeks, and I will send you the plan eventually. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | I am currently working on this project for two weeks, and I will send you the schedule eventually. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | Can you specify the deadline? I have an appointment with the client to discuss the contract. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | Could you clarify the deadline? I have an appointment with the client to discuss it. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | Can you let me know the deadline? I have an appointment with the client to talk about the contract. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | I attended the conference last week and it was very interesting; the speakers were very nice. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | I helped with the conference last week, and it was very interesting. The speakers were very friendly. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | I went to the conference last week and it was very interesting. The speakers were very nice. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | Thanks for all the information, I will let you know when the training course is ready. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | Thanks for all the information, I will warn you when the training course is ready. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural | Thanks for all the information, I will tell you when the training course is ready. | fewer false friends | ✓ |
| gemma4:e2b-it-qat | natural, correct | In fact, I disagree with the proposal; the old design was faster. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | Actually, I don't agree with the proposal. The old design was faster. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | I actually disagree with the proposal. The old design was faster. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | That's a sensible approach, let's go with it. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | That's a reasonable approach, let's go with it. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | That's a good approach, let's go with it. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | Since I passed the exam last year, I can start the job in June. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | I passed the exam last year, which means I can start the job in June. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | The fix eventually worked after months of testing. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | The fix worked in the end after months of testing. | keeps the English sense | ✓ |
| gemma4:e2b-it-qat | natural, correct | The fix worked after months of testing, eventually. | keeps the English sense | ✓ |
| qwen3.5:4b | meter | yo t'es chaud pour un kebab ce soir ou quoi | 1 | 1 |
| qwen3.5:4b | meter | lol ok np, ttyl | 1 | 1 |
| qwen3.5:4b | meter | salut, tu peux me renvoyer le doc stp ? | 2 | 2 |
| qwen3.5:4b | meter | hey, can you send me the file when you get a sec? | 2 | 2 |
| qwen3.5:4b | meter | Bonjour, pouvez-vous me renvoyer le document ? Merci. | 3 | 3 |
| qwen3.5:4b | meter | Hi Paul, could you send me the report before Friday? Thanks. | 3 | 2 |
| qwen3.5:4b | meter | The meeting is scheduled for next Thursday. | 3 | 2 |
| qwen3.5:4b | meter | Le déploiement est prévu pour jeudi prochain. | 3 | 3 |
| qwen3.5:4b | meter | Bonjour Madame, pourriez-vous me transmettre le document avant vendredi ? Je vous remercie par avance. | 4 | 4 |
| qwen3.5:4b | meter | Dear Mr. Smith, could you please send me the signed contract at your earliest convenience? | 4 | 4 |
| qwen3.5:4b | meter | Madame la Directrice, je vous prie d'agréer l'expression de mes salutations distinguées. | 5 | 5 |
| qwen3.5:4b | meter | We hereby acknowledge receipt of your correspondence dated 3 October and shall respond in due course. | 5 | 4 |
| qwen3.5:4b | formal | Bonjour, je souhaitais simplement vérifier si vous auriez la possibilité de consulter mon document d'ici jeudi. Je reste à votre disposition dans le cas contraire. | sounds more formal | ✓ |
| qwen3.5:4b | formal | Madame, Monsieur, je me permets de vous solliciter afin de savoir si vous pourriez examiner mon document avant jeudi prochain. Aucun problème si cela ne vous convient pas. | sounds more formal | ✓ |
| qwen3.5:4b | formal | Bonjour, je vous contacte pour connaître la disponibilité de votre temps afin de revoir mon document d'ici jeudi. Je comprends tout à fait si cette demande ne peut être honorée. | sounds more formal | ✓ |
| qwen3.5:4b | formal | I am writing to inquire whether it might be feasible to reschedule our meeting to this Friday at 3:00 PM. | sounds more formal | ✓ |
| qwen3.5:4b | formal | Could you please confirm if moving our call to Friday at 3:00 PM would work for you? | sounds more formal | ✓ |
| qwen3.5:4b | formal | I would like to request a brief discussion regarding the possibility of shifting our appointment to Friday at 3:00 PM. | sounds more formal | ✓ |
| qwen3.5:4b | formal | Je suggère que nous puissions envisager la livraison de la version 2.4 ce vendredi, sous réserve de l'approbation de M. Paul. | sounds more formal | ✓ |
| qwen3.5:4b | formal | Il me semble opportun de proposer la mise en œuvre de la version 2.4 d'ici vendredi, à condition que M. Paul valide cette proposition. | sounds more formal | ✓ |
| qwen3.5:4b | formal | Je pense qu'il serait judicieux d'essayer de livrer la version 2.4 ce vendredi, si M. Paul est favorable. | sounds more formal | ✗ |
| qwen3.5:4b | formal | I recommend proceeding with the second option, as it appears to be more cost-effective. | sounds more formal | ✓ |
| qwen3.5:4b | formal | It would be advisable to select the second option, given its apparent lower cost. | sounds more formal | ✓ |
| qwen3.5:4b | formal | I suggest opting for the second option, which seems to offer greater value due to its reduced price. | sounds more formal | ✓ |
| qwen3.5:4b | friendly | Bonjour, j'aimerais simplement savoir si vous auriez un moment pour consulter mon document avant jeudi. Pas de problème si ce n'est pas possible. | passes the checks | ✓ |
| qwen3.5:4b | friendly | Salut, je me permets de te demander si tu pourrais prendre le temps de regarder mon doc avant jeudi. Ce n'est absolument pas grave si tu ne peux pas. | passes the checks | ✓ |
| qwen3.5:4b | friendly | Bonjour, j'espère que tu vas bien. Serait-il possible de prendre un peu de temps pour examiner mon document avant jeudi ? Pas de souci si ce n'est pas envisageable. | passes the checks | ✓ |
| qwen3.5:4b | friendly | Hi there! I was wondering if it might be possible to reschedule our call to this Friday at 3 PM? | passes the checks | ✓ |
| qwen3.5:4b | friendly | Hello! Just a quick thought: would you be open to moving our call to Friday at 3 PM? | passes the checks | ✓ |
| qwen3.5:4b | friendly | Hey! I hope you're having a good week. Would it work for you to shift our call to Friday at 3 PM? | passes the checks | ✓ |
| qwen3.5:4b | friendly | Je pense que nous pourrions envisager de livrer la version 2.4 ce vendredi, à condition que Paul soit d'accord. | passes the checks | ✓ |
| qwen3.5:4b | friendly | Il me semble tout à fait possible de viser la livraison de la version 2.4 ce vendredi, si Paul le valide. | passes the checks | ✓ |
| qwen3.5:4b | friendly | Je serais ravi de pouvoir livrer la version 2.4 ce vendredi, tant que Paul est favorable à cette proposition. | passes the checks | ✓ |
| qwen3.5:4b | friendly | I believe the second option is likely our best choice, as it appears to be slightly more affordable. | passes the checks | ✓ |
| qwen3.5:4b | friendly | I think we should probably go ahead with the second option; it looks like it might save us a bit of money. | passes the checks | ✓ |
| qwen3.5:4b | friendly | It seems wise to choose the second option, given that it appears to be a bit cheaper. | passes the checks | ✓ |
| qwen3.5:4b | confident | Salut, je veux que tu regardes mon doc avant jeudi. | fewer hedges | ✓ |
| qwen3.5:4b | confident | Salut, vérifie mon doc avant jeudi. | fewer hedges | ✓ |
| qwen3.5:4b | confident | Salut, regarde mon doc avant jeudi. | fewer hedges | ✓ |
| qwen3.5:4b | confident | Hey, can we move our call to Friday at 3pm? | fewer hedges | ✓ |
| qwen3.5:4b | confident | Hi, would you be available to reschedule our call to Friday at 3pm? | fewer hedges | ✓ |
| qwen3.5:4b | confident | Hello, I'd like to propose moving our call to Friday at 3pm. | fewer hedges | ✓ |
| qwen3.5:4b | confident | Nous livrons la version 2.4 vendredi si Paul le confirme. | fewer hedges | ✓ |
| qwen3.5:4b | confident | La livraison de la version 2.4 a lieu vendredi sous réserve de l'accord de Paul. | fewer hedges | ✓ |
| qwen3.5:4b | confident | Paul valide-t-il la livraison de la version 2.4 ce vendredi ? | fewer hedges | ✓ |
| qwen3.5:4b | confident | We should choose the second option as it is more cost-effective. | fewer hedges | ✓ |
| qwen3.5:4b | confident | The second option is the clear choice because it saves money. | fewer hedges | ✓ |
| qwen3.5:4b | confident | Selecting the second option is the logical decision given its lower cost. | fewer hedges | ✓ |
| qwen3.5:4b | shorter | Salut, as-tu le temps de regarder mon doc avant jeudi ? | fewer words | ✓ |
| qwen3.5:4b | shorter | Salut, pourrais-tu consulter mon doc avant jeudi ? | fewer words | ✓ |
| qwen3.5:4b | shorter | Salut, tu auras peut-être le temps de voir mon doc avant jeudi ? | fewer words | ✓ |
| qwen3.5:4b | shorter | Could we move our call to Friday at 3pm? | fewer words | ✓ |
| qwen3.5:4b | shorter | Is moving our call to Friday at 3pm possible? | fewer words | ✓ |
| qwen3.5:4b | shorter | Would you be available to move our call to Friday at 3pm? | fewer words | ✓ |
| qwen3.5:4b | shorter | Je propose de livrer la version 2.4 vendredi, à condition que Paul soit d'accord. | fewer words | ✓ |
| qwen3.5:4b | shorter | On pourrait livrer la version 2.4 vendredi si Paul accepte. | fewer words | ✓ |
| qwen3.5:4b | shorter | Paul doit-il accepter pour livrer la version 2.4 vendredi ? | fewer words | ✓ |
| qwen3.5:4b | shorter | I recommend the second option; it appears cheaper. | fewer words | ✓ |
| qwen3.5:4b | shorter | Let's choose the second option, as it seems less expensive. | fewer words | ✓ |
| qwen3.5:4b | shorter | The second option is likely better due to its lower cost. | fewer words | ✓ |
| qwen3.5:4b | natural | I've actually been working on this project for two weeks; I'll send you the schedule eventually. | fewer false friends | ✓ |
| qwen3.5:4b | natural | In fact, I have been working on this project for two weeks and will send you the schedule possibly. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Actually, I have been working on this project for two weeks. I will send you the schedule if needed. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Can you specify the deadline? I have an appointment with the client to discuss the contract. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Could you clarify the deadline? I have a meeting with the client to talk about the contract. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Can you tell me the exact deadline? I'm seeing the client soon to go over the contract. | fewer false friends | ✓ |
| qwen3.5:4b | natural | I attended the conference last week; it was very interesting, and the speakers were quite friendly. | fewer false friends | ✓ |
| qwen3.5:4b | natural | I went to the conference last week, which was fascinating. The speakers were very nice. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Last week I attended a conference that was truly interesting. The speakers were very approachable. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Thanks for all the information; I'll let you know when the training course is ready. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Thank you for all the information. I will warn you once the training course is available. | fewer false friends | ✓ |
| qwen3.5:4b | natural | Thanks for all the information. I'll notify you as soon as the training course is ready. | fewer false friends | ✓ |
| qwen3.5:4b | natural, correct | I actually disagree with the proposal; the original design was faster. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | To be honest, I disagree with the proposal because the older design performed better. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | Actually, I'm against the proposal—the old design was quicker. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | That's a reasonable approach; let's go with it. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | That makes sense; let's do it. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | That's a sound approach; let's proceed. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | I took the exam last year, so I can start the job in June. | keeps the English sense | ✗ |
| qwen3.5:4b | natural, correct | I passed the exam last year, so I'm ready to start the job in June. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | Since I passed the exam last year, I can begin the job in June. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | The fix finally worked after months of testing. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | The fix eventually worked after months of testing. | keeps the English sense | ✓ |
| qwen3.5:4b | natural, correct | After months of testing, the fix finally worked. | keeps the English sense | ✓ |