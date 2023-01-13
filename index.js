const R = require('ramda');
const history = require('./game-results.json');

// TEST RESULTS
log(generateTeamsOutOfHistory(history));

// FUNCTIONS
function generateTeamsOutOfHistory(history) {
	return R.reduce((acc, game) => {
		return R.compose(
			R.sortBy(R.prop('rating')),
			R.values,
			newRatingForBothNations(game),
			addTeamIfMissing(game.away_team),
			addTeamIfMissing(game.home_team)
		)(acc);
	}, {}, history);
}

function addTeamIfMissing(teamName) {
	return R.ifElse(
		R.has(teamName),
		R.identity,
		R.assoc(teamName, {
			name: teamName,
			rating: 1500,
			numberOfGames: 0,
			gameHistory: []
		})
	);
}

function teamGameResult(teamName, game) {
	const victory = 1;
	const draw = 0.5;
	const loss = 0;

	return R.ifElse(
		g => R.equals(teamName, game.home_team),
		R.cond([
			[g => g.home_score === g.away_score,	R.always(draw)],
			[g => g.home_score > g.away_score, 		R.always(victory)],
			[R.T, 									R.always(loss)]
		]),
		R.cond([
			[g => g.home_score === g.away_score,	R.always(draw)],
			[g => g.home_score > g.away_score, 		R.always(loss)],
			[R.T, 									R.always(victory)]
		])
	)(game);
}

function newRatingForBothNations(game) {
	const homeTeamName = game.home_team;
	const homeTeamResult = teamGameResult(homeTeamName, game);
	const awayTeamName = game.away_team;
	const awayTeamResult = teamGameResult(awayTeamName, game);

	return acc => {
		const homeTeam = acc[homeTeamName];
		const homeTeamKFactor = kFactorForTeam(homeTeam);
		const awayTeam = acc[awayTeamName];
		const awayTeamKFactor = kFactorForTeam(awayTeam);

		const homeTeamExpectedResult = expectedResult(homeTeam, awayTeam);
		const homeTeamNewRating = newRatingForTeam(homeTeam, homeTeamResult, homeTeamExpectedResult);
		const awayTeamExpectedResult = expectedResult(awayTeam, homeTeam);
		const awayTeamNewRating = newRatingForTeam(awayTeam, awayTeamResult, awayTeamExpectedResult);

		homeTeam.rating = homeTeamNewRating;
		homeTeam.numberOfGames += 1;
		homeTeam.gameHistory.push(game);

		awayTeam.rating = awayTeamNewRating;
		awayTeam.numberOfGames += 1;
		awayTeam.gameHistory.push(game);

		return R.compose(
			R.assoc(awayTeamName, awayTeam),
			R.assoc(homeTeamName, homeTeam)
		)(acc);
	};
}

function newRatingForTeam(team, gameResultForTeam, expectedResultForTeam) {
	return Math.round(team.rating + kFactorForTeam(team) * (gameResultForTeam - expectedResultForTeam));
}

function kFactorForTeam(team) {
	return kFactor(team.numberOfGames, team.rating);
}

function kFactor(teamNbGames, teamRating) {
	const kFactorNewbie = 40;
	const kFactorWeak = 20;
	const kFactorStrong = 10;

	if (teamNbGames < 30) {
		return kFactorNewbie;
	} else if (teamRating <= 2400) {
		return kFactorWeak;
	} else {
		return kFactorStrong;
	}
}

function expectedResult(teamA, teamB) {
	// Return the expected score for teamA
	return 1 / (1 + Math.pow(10, (teamB.rating - teamA.rating) / 400));
}

function pointsToAdd(teamA, teamB) {
	return Math.round(teamA.kfactor * (1 / (1 + Math.pow(10, pointsDifference(data.lastPointsPlayer1, data.lastPointsPlayer2) / 400))));
}

function pointsDifference(winnerPoints, looserPoints) {
	// Check the params of the function
	check(winnerPoints, Number);
	check(looserPoints, Number);

	var diff = Math.abs(winnerPoints - looserPoints);
	if (winnerPoints - looserPoints < 0) {
		if (diff > 400) {
			return -400;
		} else {
			return winnerPoints - looserPoints;
		}
	} else if (winnerPoints - looserPoints > 0) {
		if (diff > 400) {
			return 400;
		} else {
			return winnerPoints - looserPoints;
		}
	} else {
		return 0;
	}
}

function log(content) {
    console.log(...arguments);
    return content;
}
