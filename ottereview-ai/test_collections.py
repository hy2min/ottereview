import sys
import os
sys.path.append('.')
from utils.vector_db import VectorDB, PRData, FileInfo, CommitInfo, ReviewInfo, ReviewCommentInfo
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_multiple_collections():
    print('Testing multiple collections and advanced features')
    
    try:
        vector_db = VectorDB('./test_collections')
        print('VectorDB instance created with 3 collections')
        
        # Create multiple test PRs with different characteristics
        
        # PR 1: Backend API
        pr1_data = PRData(
            source_branch='feature/user-api',
            target_branch='develop',
            title='feat: implement user management API',
            body='Added CRUD operations for user management with proper validation and error handling.',
            repository_name='ottereview-backend',
            files=[
                FileInfo('src/main/java/UserController.java', 'added', 120, 0, ''),
                FileInfo('src/main/java/UserService.java', 'added', 95, 0, ''),
                FileInfo('src/test/java/UserControllerTest.java', 'added', 85, 0, '')
            ],
            commits=[
                CommitInfo('hash1', 'feat: add user controller', 'backend-dev', 'backend@dev.com', 120, 0),
                CommitInfo('hash2', 'feat: add user service', 'backend-dev', 'backend@dev.com', 95, 0),
                CommitInfo('hash3', 'test: add controller tests', 'backend-dev', 'backend@dev.com', 85, 0)
            ],
            reviewers=['senior-backend', 'api-expert', 'security-reviewer'],
            reviews=[
                ReviewInfo(
                    user_github_username='senior-backend',
                    state='APPROVED',
                    body='Clean implementation with good separation of concerns.',
                    commit_sha='hash1',
                    review_comments=[
                        ReviewCommentInfo('senior-backend', 'src/main/java/UserController.java', 'Consider adding rate limiting', 45)
                    ]
                )
            ]
        )
        
        # PR 2: Frontend component
        pr2_data = PRData(
            source_branch='feature/dashboard',
            target_branch='main',
            title='feat: create dashboard component with charts',
            body='Interactive dashboard with data visualization using Chart.js',
            repository_name='ottereview-frontend',
            files=[
                FileInfo('src/components/Dashboard.tsx', 'added', 200, 0, ''),
                FileInfo('src/components/Chart.tsx', 'added', 150, 0, ''),
                FileInfo('src/styles/Dashboard.css', 'added', 80, 0, ''),
                FileInfo('src/hooks/useChartData.ts', 'added', 60, 0, '')
            ],
            commits=[
                CommitInfo('hash4', 'feat: implement dashboard layout', 'frontend-dev', 'frontend@dev.com', 280, 0),
                CommitInfo('hash5', 'feat: add chart components', 'frontend-dev', 'frontend@dev.com', 210, 0)
            ],
            reviewers=['ui-expert', 'senior-frontend', 'design-reviewer'],
            reviews=[
                ReviewInfo(
                    user_github_username='ui-expert',
                    state='REQUEST_CHANGES',
                    body='UI looks great but needs accessibility improvements',
                    commit_sha='hash4',
                    review_comments=[
                        ReviewCommentInfo('ui-expert', 'src/components/Dashboard.tsx', 'Add ARIA labels', 25),
                        ReviewCommentInfo('ui-expert', 'src/components/Chart.tsx', 'Keyboard navigation needed', 15)
                    ]
                )
            ]
        )
        
        # PR 3: AI service
        pr3_data = PRData(
            source_branch='feature/sentiment-analysis',
            target_branch='main',
            title='feat: add sentiment analysis for reviews',
            body='ML model integration for analyzing review sentiment and providing insights',
            repository_name='ottereview-ai',
            files=[
                FileInfo('src/analysis/sentiment.py', 'added', 180, 0, ''),
                FileInfo('src/models/sentiment_model.py', 'added', 120, 0, ''),
                FileInfo('requirements.txt', 'modified', 5, 0, ''),
                FileInfo('tests/test_sentiment.py', 'added', 90, 0, '')
            ],
            commits=[
                CommitInfo('hash6', 'feat: implement sentiment analysis', 'ai-dev', 'ai@dev.com', 300, 0),
                CommitInfo('hash7', 'test: add sentiment tests', 'ai-dev', 'ai@dev.com', 95, 0)
            ],
            reviewers=['ml-expert', 'senior-python', 'data-scientist'],
            reviews=[
                ReviewInfo(
                    user_github_username='ml-expert',
                    state='APPROVED',
                    body='Solid implementation with good model performance',
                    commit_sha='hash6',
                    review_comments=[]
                ),
                ReviewInfo(
                    user_github_username='data-scientist',
                    state='COMMENTED',
                    body='Consider adding model validation metrics',
                    commit_sha='hash6',
                    review_comments=[
                        ReviewCommentInfo('data-scientist', 'src/models/sentiment_model.py', 'Add precision/recall metrics', 80)
                    ]
                )
            ]
        )
        
        # Store all PRs
        test_prs = [
            ('pr-backend-comprehensive', pr1_data),
            ('pr-frontend-comprehensive', pr2_data), 
            ('pr-ai-comprehensive', pr3_data)
        ]
        
        for pr_id, pr_data in test_prs:
            print(f'\\nStoring {pr_id}...')
            result = await vector_db.store_pr_data(pr_id, pr_data)
            if result:
                print(f'SUCCESS: {pr_id} stored')
            else:
                print(f'ERROR: Failed to store {pr_id}')
        
        # Check final collection counts
        print('\\n=== Collection Status ===')
        pr_count = vector_db.pr_collection.count()
        review_count = vector_db.review_collection.count()
        reviewer_count = vector_db.reviewer_collection.count()
        
        print(f'PR Collection: {pr_count} documents')
        print(f'Review Collection: {review_count} documents') 
        print(f'Reviewer Collection: {reviewer_count} documents')
        
        # Test similarity search across all collections
        print('\\n=== Testing Similarity Search ===')
        query = 'user management API backend Java Spring'
        similar_prs = await vector_db.find_similar_prs(query, limit=5)
        
        print(f'Query: "{query}"')
        print(f'Found {len(similar_prs)} similar PRs:')
        for pr in similar_prs:
            print(f'  - {pr["pr_id"]}: {pr["title"]} (similarity: {pr["similarity_score"]:.3f})')
            print(f'    Repository: {pr["repository"]}, Files: {len(pr["file_paths"])}')
        
        print('\\nMultiple collections test completed successfully')
        
    except Exception as e:
        print(f'Test error: {str(e)}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_multiple_collections())