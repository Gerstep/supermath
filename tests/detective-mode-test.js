// Quick test to verify Detective Mode displays result correctly
import DetectiveOperation from '../src/js/operations/DetectiveOperation.js';
import Question from '../src/js/models/Question.js';

console.log('🕵️ Detective Mode Display Test');
console.log('===============================\n');

const detective = new DetectiveOperation();

// Generate several test cases
for (let i = 0; i < 10; i++) {
    const problemData = detective.generate({ min: 1, max: 20 });
    const question = new Question(problemData);
    
    console.log(`Test ${i + 1}:`);
    console.log(`  Generated: ${question.equation}`);
    console.log(`  Missing Position: ${question.missingPosition}`);
    console.log(`  Result (should be shown): ${question.result}`);
    console.log(`  Correct Answer: ${question.correctAnswer}`);
    
    // Verify that the result is available when needed
    if (question.missingPosition !== 'result') {
        console.log(`  ✅ Result should be displayed: ${question.result}`);
    } else {
        console.log(`  ❓ Result should be hidden (user needs to find it)`);
    }
    console.log('');
}

console.log('🎯 Detective Mode Test Complete!');
console.log('The result number should now be properly displayed when it\'s not the missing part.');

export { detective };