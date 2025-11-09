"""Workflow orchestration service."""
import threading
import time
from flask import current_app
from extensions import db
from models.workflow import WorkflowRun
from models.poster import GeneratedPoster
from models.video import GeneratedVideo
from models.critique import Critique
from services.poster_service import PosterService
from services.video_service import VideoService
from services.critique_service import CritiqueService


class WorkflowService:
    """Service for multi-agent workflow orchestration."""
    
    def __init__(self):
        self.max_iterations = current_app.config.get('MAX_WORKFLOW_ITERATIONS', 3)
        self.target_score = current_app.config.get('TARGET_SCORE_THRESHOLD', 0.8)
        self.timeout = current_app.config.get('GENERATION_TIMEOUT_SECONDS', 120)
    
    def run_async(self, workflow_id: str):
        """Trigger async workflow execution."""
        thread = threading.Thread(
            target=self._run_workflow,
            args=(workflow_id,)
        )
        thread.daemon = True
        thread.start()
    
    def _run_workflow(self, workflow_id: str):
        """Execute multi-agent workflow."""
        try:
            workflow = WorkflowRun.query.get(workflow_id)
            if not workflow:
                raise Exception(f'Workflow not found: {workflow_id}')
            
            iteration = 0
            current_prompt = workflow.prompt
            best_scores = {}
            generated_content_id = None
            
            while iteration < self.max_iterations:
                current_app.logger.info(f'Workflow {workflow_id} - Iteration {iteration + 1}')
                
                # Step 1: Generate content
                self._update_workflow_step(workflow_id, 'generating', iteration)
                content_id = self._generate_content(workflow, current_prompt)
                
                if not content_id:
                    raise Exception('Content generation failed')
                
                generated_content_id = content_id
                
                # Wait for generation
                media_url = self._wait_for_generation(workflow.content_type, content_id)
                if not media_url:
                    raise Exception('Generation timeout or failed')
                
                # Step 2: Critique content
                self._update_workflow_step(workflow_id, 'critiquing', iteration)
                critique_result = self._critique_content(workflow, media_url, current_prompt)
                
                best_scores = {
                    'brand_fit_score': critique_result.brand_fit_score,
                    'visual_quality_score': critique_result.visual_quality_score,
                    'message_clarity_score': critique_result.message_clarity_score,
                    'tone_of_voice_score': critique_result.tone_of_voice_score,
                    'safety_score': critique_result.safety_score
                }
                
                # Calculate average score
                avg_score = sum(best_scores.values()) / len(best_scores)
                
                if avg_score >= self.target_score:
                    current_app.logger.info(f'Target score achieved: {avg_score:.2f}')
                    self._finalize_workflow(workflow_id, 'completed', generated_content_id, critique_result.id, iteration + 1, best_scores)
                    return
                
                # Step 3: Refine for next iteration
                if iteration < self.max_iterations - 1 and critique_result.refinement_prompt:
                    self._update_workflow_step(workflow_id, 'refining', iteration)
                    current_prompt = critique_result.refinement_prompt
                
                iteration += 1
            
            # Max iterations reached
            self._finalize_workflow(workflow_id, 'completed', generated_content_id, critique_result.id, iteration, best_scores)
            
        except Exception as e:
            current_app.logger.error(f'Workflow error: {e}')
            workflow = WorkflowRun.query.get(workflow_id)
            if workflow:
                workflow.status = 'failed'
                workflow.error_message = str(e)
                db.session.commit()
    
    def _update_workflow_step(self, workflow_id: str, step: str, iteration: int):
        """Update workflow progress."""
        workflow = WorkflowRun.query.get(workflow_id)
        if workflow:
            workflow.current_step = step
            workflow.iteration_count = iteration
            db.session.commit()
    
    def _generate_content(self, workflow: WorkflowRun, prompt: str) -> str:
        """Generate content based on workflow type."""
        if workflow.content_type == 'video':
            service = VideoService()
            video = GeneratedVideo(
                prompt=prompt,
                brand_logo_url=workflow.brand_logo_url,
                product_image_url=workflow.product_image_url,
                brand_colors=workflow.brand_colors,
                aspect_ratio=workflow.aspect_ratio,
                status='pending'
            )
            db.session.add(video)
            db.session.commit()
            
            service.generate_async(video.id, {
                'prompt': prompt,
                'brandLogo': workflow.brand_logo_url,
                'productImage': workflow.product_image_url,
                'brandColors': workflow.brand_colors,
                'aspectRatio': workflow.aspect_ratio
            })
            return video.id
        else:
            service = PosterService()
            poster = GeneratedPoster(
                prompt=prompt,
                brand_logo_url=workflow.brand_logo_url,
                product_image_url=workflow.product_image_url,
                brand_colors=workflow.brand_colors,
                aspect_ratio=workflow.aspect_ratio,
                status='pending'
            )
            db.session.add(poster)
            db.session.commit()
            
            service.generate_async(poster.id, {
                'prompt': prompt,
                'brandLogo': workflow.brand_logo_url,
                'productImage': workflow.product_image_url,
                'brandColors': workflow.brand_colors,
                'aspectRatio': workflow.aspect_ratio
            })
            return poster.id
    
    def _wait_for_generation(self, content_type: str, content_id: str) -> str:
        """Wait for content generation to complete."""
        start_time = time.time()
        
        while time.time() - start_time < self.timeout:
            if content_type == 'video':
                video = GeneratedVideo.query.get(content_id)
                if video and video.status == 'completed' and video.video_url:
                    return video.video_url
                if video and video.status == 'failed':
                    return None
            else:
                poster = GeneratedPoster.query.get(content_id)
                if poster and poster.status == 'completed' and poster.poster_url:
                    return poster.poster_url
                if poster and poster.status == 'failed':
                    return None
            
            time.sleep(3)
        
        return None
    
    def _critique_content(self, workflow: WorkflowRun, media_url: str, prompt: str) -> Critique:
        """Critique generated content."""
        service = CritiqueService()
        brand_colors = workflow.brand_colors.split(',') if workflow.brand_colors else []
        
        result = service.critique_content(
            media_url=media_url,
            media_type=workflow.content_type,
            brand_colors=brand_colors,
            caption=prompt
        )
        
        critique = Critique(
            media_url=media_url,
            media_type=workflow.content_type,
            caption=prompt,
            brand_colors=workflow.brand_colors,
            brand_fit_score=result.get('BrandFit_Score', 0),
            visual_quality_score=result.get('VisualQuality_Score', 0),
            message_clarity_score=result.get('MessageClarity_Score', 0),
            tone_of_voice_score=result.get('ToneOfVoice_Score', 0),
            safety_score=result.get('Safety_Score', 0),
            brand_validation=result.get('BrandValidation'),
            safety_breakdown=result.get('SafetyBreakdown'),
            critique_summary=result.get('Critique_Summary', ''),
            refinement_prompt=result.get('Refinement_Prompt_Suggestion', '')
        )
        
        db.session.add(critique)
        db.session.commit()
        
        return critique
    
    def _finalize_workflow(self, workflow_id: str, status: str, content_id: str, critique_id: str, iterations: int, scores: dict):
        """Finalize workflow execution."""
        workflow = WorkflowRun.query.get(workflow_id)
        if workflow:
            workflow.status = status
            workflow.current_step = 'completed'
            workflow.generated_content_id = content_id
            workflow.critique_id = critique_id
            workflow.iteration_count = iterations
            workflow.final_scores = scores
            db.session.commit()
