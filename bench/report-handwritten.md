# Grammar benchmark: handwritten

| Model | Fully fixed | Checks passed | Median latency |
|---|---|---|---|
| gemma4:e2b-it-qat | 10/10 | 100% | 0.58s |
| gemma3:4b | 8/10 | 97% | 0.97s |
| qwen3.5:4b | 7/10 | 93% | 1.14s |
| llama3.1 | 7/10 | 93% | 1.44s |
| qwen3:4b-instruct | 4/10 | 86% | 0.77s |
| ministral-3:3b | 4/10 | 83% | 0.68s |

### 1. `salut, jai bien recu ton messsage. je regarde sa demain matin et je te fait un retour dans la journee`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Salut, j'ai bien reçu ton message. Je regarde ça demain matin et je te fais un retour dans la journée. | ✓ |
| qwen3.5:4b | Salut, j'ai bien reçu ton message. Je regarde ça demain matin et je te fais un retour dans la journée. | ✓ |
| gemma3:4b | Salut, j'ai bien reçu ton message. Je regarde ça demain matin et je te fais un retour dans la journée. | ✓ |
| qwen3:4b-instruct | Salut, j'ai bien reçu ton message. Je regarde ça demain matin et je te fais un retour dans la journée. | ✓ |
| ministral-3:3b | Salut, j’ai bien reçu ton message. Je regarde ça demain matin et je te ferai un retour dans la journée. | ✗ missing /je te fais un retour/ |
| llama3.1 | salut, j'ai bien reçu ton message. je regarde ça demain matin et je te fais un retour dans la journée | ✓ |

### 2. `les fichiers que tu ma envoyer sont corrompu, tu peut me les renvoyer stp ?`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Les fichiers que tu m'as envoyés sont corrompus, tu peux me les renvoyer s'il te plaît ? | ✓ |
| qwen3.5:4b | Les fichiers que tu m'as envoyés sont corrompus, tu peux me les renvoyer s'il te plaît ? | ✓ |
| gemma3:4b | Les fichiers que tu m'as envoyés sont corrompus, tu peux me les renvoyer s'il te plaît ? | ✓ |
| qwen3:4b-instruct | Les fichiers que tu m'as envoyé sont corrompus, tu peux me les renvoyer stp ? | ✗ missing /tu m['’]as envoyés/ |
| ministral-3:3b | Les fichiers que tu **m’as** envoyé sont corrompus, tu peux me les renvoyer, s’il te plaît ? | ✗ missing /tu m['’]as envoyés/, forbidden /\*\*/ |
| llama3.1 | les fichiers que tu m'as envoyés sont corrompus, tu peux me les renvoyer s'il te plaît ? | ✓ |

### 3. `On a decider de repousser la mise en prod a jeudi, les test ne sont pas encore tout a fait fini.`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | On a décidé de repousser la mise en prod à jeudi, les tests ne sont pas encore tout à fait finis. | ✓ |
| qwen3.5:4b | Sur un décider pour repousser la mise en prod à jeudi, les tests ne sont pas encore tout à fait finis. | ✗ missing /On a décidé/ |
| gemma3:4b | On a décidé de repousser la mise en production à jeudi, les tests ne sont pas encore tout à fait finis. | ✓ |
| qwen3:4b-instruct | On a décider de repousser la mise en production à jeudi, les tests ne sont pas encore tout à fait finis. | ✗ missing /On a décidé/ |
| ministral-3:3b | On a décidé de repousser la mise en production à jeudi, les tests ne sont pas encore tout à fait terminés. | ✓ |
| llama3.1 | On a décidé de repousser la mise en production à jeudi, les tests ne sont pas encore tout à fait finis. | ✓ |

### 4. `je suis passer chez le medecin ce matin, il ma dit que ce netait rien de grave`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Je suis passé chez le médecin ce matin, il m'a dit que ce n'était rien de grave. | ✓ |
| qwen3.5:4b | Je suis passé chez le médecin ce matin, il m'a dit que ce n'était rien de grave. | ✓ |
| gemma3:4b | Je suis passé chez le médecin ce matin, il m'a dit que ce n'était rien de grave. | ✓ |
| qwen3:4b-instruct | Je suis passé chez le médecin ce matin, il m'a dit que ce n'était rien de grave. | ✓ |
| ministral-3:3b | Je suis allé chez le médecin ce matin ; il m’a dit que ce n’était rien de grave. | ✗ missing /suis passée?/ |
| llama3.1 | je suis passé chez le médecin ce matin, il m'a dit que ce n'était rien de grave | ✓ |

### 5. `Est ce que quelqun a deja eu ce probleme avec le build ? sa plante a chaque fois que je lance les tests unitaire`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Est-ce que quelqu'un a déjà eu ce problème avec le build ? Ça plante à chaque fois que je lance les tests unitaires. | ✓ |
| qwen3.5:4b | Est-ce que quelqu'un a déjà eu ce problème avec le build ? Ça plante à chaque fois que je lance les tests unitaires. | ✓ |
| gemma3:4b | Est-ce que quelqu’un a déjà eu ce problème avec le build ? Sa plante à chaque fois que je lance les tests unitaires. | ✗ missing /ça plante/ |
| qwen3:4b-instruct | Est-ce que quelqu'un a déjà eu ce problème avec le build ? Sa plante chaque fois que je lance les tests unitaires. | ✗ missing /ça plante/, missing /à chaque fois/ |
| ministral-3:3b | Est-ce que quelqu'un a déjà eu ce problème avec le build ? Il plante à chaque fois que je lance les tests unitaires. | ✗ missing /ça plante/ |
| llama3.1 | Est-ce que quelqu'un a déjà eu ce problème avec le build ? Sa plante ne fonctionne pas chaque fois que je lance les tests unitaires. | ✗ missing /ça plante/, missing /à chaque fois/ |

### 6. `Merci a tous pour vos retour, jai integrer la plupart des remarques et la nouvelle version est disponnible sur le drive`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Merci à tous pour vos retours, j'ai intégré la plupart des remarques et la nouvelle version est disponible sur le drive | ✓ |
| qwen3.5:4b | Merci à tous pour vos retours ; j'ai intégré la plupart des remarques et la nouvelle version est disponible sur le Drive. | ✓ |
| gemma3:4b | Merci à tous pour vos retours, j'ai intégré la plupart des remarques et la nouvelle version est disponible sur le drive. | ✓ |
| qwen3:4b-instruct | Merci à tous pour vos retours, j'ai intégré la plupart des remarques et la nouvelle version est disponible sur le drive. | ✓ |
| ministral-3:3b | Merci à tous pour vos retours, j’ai intégré la plupart des remarques et la nouvelle version est disponible sur le drive. | ✓ |
| llama3.1 | Merci à tous pour vos retours, j'ai intégré la plupart des remarques et la nouvelle version est disponible sur le drive. | ✓ |

### 7. `Je pense qu'il faudrais qu'on se voit la semaine prochaine pour en discutter, quesque tu en pense ?`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Je pense qu'il faudrait qu'on se voie la semaine prochaine pour en discuter, qu'en penses-tu ? | ✓ |
| qwen3.5:4b | Je pense qu'il faudrait qu'on se voie la semaine prochaine pour en discuter, quelle est ta pensée ? | ✗ missing /qu['’]est-ce que tu en penses\|qu['’]en penses-tu/ |
| gemma3:4b | Je pense qu’il faudrait qu’on se voie la semaine prochaine pour en discuter, qu’est-ce que tu en penses ? | ✓ |
| qwen3:4b-instruct | Je pense qu'il faudrait qu'on se voit la semaine prochaine pour en discuter, quelles en penses ? | ✗ missing /se voie/, missing /qu['’]est-ce que tu en penses\|qu['’]en penses-tu/ |
| ministral-3:3b | Je pense qu’il faudrait qu’on se voie la semaine prochaine pour en discuter. Qu’en penses-tu ? | ✓ |
| llama3.1 | Je pense qu'il faudrait qu'on se voit la semaine prochaine pour en discuter, qu'est-ce que tu en penses ? | ✗ missing /se voie/ |

### 8. `ma soeur et moi somme aller au cinema hier soir, le film etait vraimment bien mais un peu trop long`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Ma sœur et moi sommes allées au cinéma hier soir, le film était vraiment bien mais un peu trop long. | ✓ |
| qwen3.5:4b | Ma sœur et moi sommes allés au cinéma hier soir ; le film était vraiment bien, mais un peu trop long. | ✓ |
| gemma3:4b | Ma sœur et moi sommes allées au cinéma hier soir. Le film était vraiment bien, mais un peu trop long. | ✓ |
| qwen3:4b-instruct | Ma sœur et moi sommes allés au cinéma hier soir, le film était vraiment bien mais un peu trop long. | ✓ |
| ministral-3:3b | Ma sœur et moi sommes allées au cinéma hier soir. Le film était vraiment bien, mais un peu trop long. | ✓ |
| llama3.1 | Ma sœur et moi sommes allés au cinéma hier soir, le film était vraiment bien mais un peu trop long. | ✓ |

### 9. `Tu peut regarder la PR quand tu as 5 min ? j'ai refacto le composant et rajouter des test`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Tu peux regarder la PR quand tu as 5 min ? J'ai refacto le composant et rajouté des tests. | ✓ |
| qwen3.5:4b | Tu peux regarder la PR quand tu as 5 min ? J'ai refacturé le composant et ajouté des tests. | ✗ missing /j['’]ai refacto/, missing /rajouté des tests/ |
| gemma3:4b | Tu peux regarder la PR quand tu as 5 min ? J'ai refactorisé le composant et rajouté des tests. | ✗ forbidden /pull request\|refactoris\|examiner\|poussé/i |
| qwen3:4b-instruct | Tu peux regarder la PR quand tu as 5 min ? J'ai refacto le composant et ajouté des tests. | ✗ missing /rajouté des tests/ |
| ministral-3:3b | Tu peux regarder la PR quand tu as 5 minutes ? J’ai refacturé le composant et ajouté des tests. | ✗ missing /j['’]ai refacto/, missing /rajouté des tests/ |
| llama3.1 | Tu peux regarder la PR quand tu as 5 min ? J'ai refait le composant et rajouté des tests | ✗ missing /j['’]ai refacto/ |

### 10. `Les enfants on adorer la sortie au parc, ils etait tous tres contant de retrouver leur copains`

| Model | Output | Result |
|---|---|---|
| gemma4:e2b-it-qat | Les enfants ont adoré la sortie au parc, ils étaient tous très contents de retrouver leurs copains | ✓ |
| qwen3.5:4b | Les enfants ont adoré la sortie au parc, ils étaient tous très contents de retrouver leurs copains. | ✓ |
| gemma3:4b | Les enfants ont adoré la sortie au parc, ils étaient tous très contents de retrouver leurs copains. | ✓ |
| qwen3:4b-instruct | Les enfants ont adoré la sortie au parc, ils étaient tous très content de retrouver leurs copains. | ✗ missing /ils étaient tous très contents/ |
| ministral-3:3b | Les enfants **aiment** la sortie au parc ; ils **étaient** tous **très** contents de retrouver leurs copains. | ✗ missing /Les enfants ont adoré/, missing /ils étaient tous très contents/, forbidden /\*\*/ |
| llama3.1 | Les enfants ont adoré la sortie au parc, ils étaient tous très contents de retrouver leurs copains. | ✓ |
