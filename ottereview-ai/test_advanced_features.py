import sys
import os
sys.path.append('.')
from utils.vector_db import VectorDB, PRData, FileInfo, CommitInfo, ReviewInfo, ReviewCommentInfo
import asyncio
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_advanced_features():
    print('Testing advanced features: reviewer recommendations, title suggestions, priority analysis')
    
    try:
        vector_db = VectorDB('./test_advanced')
        print('VectorDB instance created')
        
        # Create a new PR for testing recommendations
        new_pr = PRData(
            source_branch='feature/chat-system',
            target_branch='develop',
            title='implement real-time chat system',
            body='Added WebSocket-based real-time chat with message persistence and user presence tracking',
            repository_name='ottereview-backend',
            files=[
                FileInfo('src/main/java/ChatController.java', 'added', 150, 0, ''),
                FileInfo('src/main/java/ChatService.java', 'added', 200, 0, ''),
                FileInfo('src/main/java/Message.java', 'added', 80, 0, ''),
                FileInfo('src/main/java/WebSocketConfig.java', 'modified', 30, 10, ''),
                FileInfo('src/test/java/ChatServiceTest.java', 'added', 120, 0, ''),
                FileInfo('README.md', 'modified', 15, 5, ''),
                FileInfo('config/application.yml', 'modified', 8, 2, '')
            ],
            commits=[
                CommitInfo('hash_chat1', 'feat: implement chat controller and service', 'chat-dev', 'chat@dev.com', 380, 10),
                CommitInfo('hash_chat2', 'feat: add websocket configuration', 'chat-dev', 'chat@dev.com', 38, 2),
                CommitInfo('hash_chat3', 'test: add comprehensive chat tests', 'chat-dev', 'chat@dev.com', 135, 5)
            ],
            reviewers=[],  # Empty for testing recommendations
            reviews=[]
        )
        
        print('\\n=== Testing Reviewer Recommendations ===')
        recommendations = await vector_db.get_reviewer_recommendations(new_pr, limit=5)
        
        if 'error' not in recommendations:
            print('SUCCESS: Reviewer recommendations generated')
            print(f'Current PR info:')
            print(f'  - Repository: {recommendations["current_pr"]["repository"]}')
            print(f'  - File categories: {recommendations["current_pr"]["file_categories"]}')
            print(f'  - Files changed: {recommendations["current_pr"]["files_changed"]}')
            print(f'  - Authors: {recommendations["current_pr"]["authors"]}')
            
            print(f'Recommendations ({len(recommendations["recommendations"])} found):')
            for i, rec in enumerate(recommendations["recommendations"][:3], 1):
                print(f'  {i}. {rec["reviewer"]} (score: {rec["score"]:.3f})')
                print(f'     - Similar PRs reviewed: {rec["rationale"]["similar_prs_reviewed"]}')
                print(f'     - Expertise areas: {rec["rationale"]["expertise_areas"]}')
                print(f'     - Total reviews: {rec["rationale"]["total_reviews"]}')
            
            print(f'Analyzed {recommendations["similar_prs_analyzed"]} similar PRs')
        else:
            print(f'ERROR: {recommendations["error"]}')
        
        print('\\n=== Testing Title Suggestions ===')
        title_context = await vector_db.get_title_suggestions(new_pr)
        
        if 'error' not in title_context:
            print('SUCCESS: Title suggestions context generated')
            current = title_context["current_pr"]
            print(f'Current PR analysis:')
            print(f'  - Repository: {current["repository"]}')
            print(f'  - Branch: {current["source_branch"]} -> {current["target_branch"]}')
            print(f'  - Commit messages: {current["commit_messages"]}')
            print(f'  - File categories: {current["file_categories"]}')
            print(f'  - Changes: +{current["total_additions"]} -{current["total_deletions"]}')
            print(f'  - Files changed: {current["files_changed"]}')
            
            analysis = title_context["analysis"]
            print(f'Analysis flags:')
            print(f'  - Has tests: {analysis["has_tests"]}')
            print(f'  - Has docs: {analysis["has_docs"]}')
            print(f'  - Is feature: {analysis["is_feature"]}')
            print(f'  - Is refactor: {analysis["is_refactor"]}')
            print(f'  - Main category: {analysis["main_category"]}')
            
            if title_context["similar_patterns"]:
                print(f'Similar title patterns ({len(title_context["similar_patterns"])}):')
                for pattern in title_context["similar_patterns"][:3]:
                    print(f'  - "{pattern["title"]}" (similarity: {pattern["similarity"]:.3f})')
                    print(f'    Repository: {pattern["repository"]}, Categories: {pattern["file_categories"]}')
        else:
            print(f'ERROR: {title_context["error"]}')
        
        print('\\n=== Testing Priority Suggestions ===')
        priority_context = await vector_db.get_priority_suggestions(new_pr)
        
        if 'error' not in priority_context:
            print('SUCCESS: Priority analysis completed')
            
            current = priority_context["current_pr"]
            print(f'Current PR overview:')
            print(f'  - Repository: {current["repository"]}')
            print(f'  - Total files: {current["total_files"]}')
            print(f'  - File categories: {current["file_categories"]}')
            print(f'  - Total changes: +{current["total_additions"]} -{current["total_deletions"]}')
            
            groups = priority_context["priority_groups"]
            print(f'Priority groups:')
            print(f'  - High priority: {len(groups["high"])} files')
            for file in groups["high"][:3]:
                print(f'    * {file["filename"]} (score: {file["priority_score"]}, reasons: {", ".join(file["reasons"])})')
            
            print(f'  - Medium priority: {len(groups["medium"])} files')
            for file in groups["medium"][:3]:
                print(f'    * {file["filename"]} (score: {file["priority_score"]}, reasons: {", ".join(file["reasons"])})')
            
            print(f'  - Low priority: {len(groups["low"])} files')
            for file in groups["low"][:3]:
                print(f'    * {file["filename"]} (score: {file["priority_score"]}, reasons: {", ".join(file["reasons"])})')
            
            recs = priority_context["recommendations"]
            print(f'Recommendations:')
            print(f'  - Review order: {recs["review_order"][:3]}...')
            print(f'  - Focus areas: {recs["focus_areas"]}')
            print(f'  - Priority files to review: {recs["total_priority_files"]}')
        else:
            print(f'ERROR: {priority_context["error"]}')
        
        print('Advanced features test completed successfully')
        
    except Exception as e:
        print(f'Test error: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_advanced_features())