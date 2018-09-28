const results = JSON.parse(data);
console.log(results);

$(function() {
    const standingsList = $("#standings-list");
    temp = ``;
    for(let i = 0; i < results.length; ++i) {
        results[i].score = 0;
        const sets = results[i].sets;
        for(let j = 0; j < sets.length; ++j) {
            results[i].score += sets[j].reps * sets[j].weight;
        }
    }  
    const sorted = results.sort(function(a, b) {
        return a.score < b.score;
    });
    for(let i = 0; i < sorted.length; ++i) {
        temp += `<li class="standing">${i + 1}. ${sorted[i].name}: ${sorted[i].score} total pounds lifted</li>`
    }
    standingsList.append(temp);
});