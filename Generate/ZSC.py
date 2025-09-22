"""
Zero-Shot Classification (ZSC) module for shitpost template filtering.

This module uses the DeBERTa small long NLI model to classify meme templates
as either "shitpost" or "not_shitpost" friendly, helping to automatically
identify templates that are suitable for creating chaotic, absurd, or humorous content.

The classification is used in the shitpost creation feature to intelligently
select templates that work well for different styles of shitposts.
"""

from transformers import pipeline
import os

# Load the DeBERTa small long NLI model for zero-shot classification
classifier = pipeline(
    "zero-shot-classification",
    model="tasksource/deberta-small-long-nli",
    # If you have GPU, set device=0, otherwise leave default (CPU)
    # device=0  
)

# Candidate labels for shitpost classification
labels = ["shitpost", "not_shitpost"]

def is_shitpost(template):
    """
    Returns True if the template is classified as 'shitpost' with enough confidence.
    `template` is assumed to be a dict with keys like 'tags' (list), 'explanation' (str), and 'name' (str).
    """
    # Combine template information for classification
    tags_text = " ".join(template.get("tags", []))
    explanation_text = template.get("explanation", "")
    name_text = template.get("name", "")
    
    # Create comprehensive text input for classification
    text_input = f"{name_text} {tags_text} {explanation_text}".strip()
    
    if not text_input:
        return False
    
    try:
        result = classifier(text_input, candidate_labels=labels)
        top_label = result["labels"][0]
        top_score = result["scores"][0]
        
        # Choose a threshold for shitpost classification
        # You can adjust this threshold based on testing results
        shitpost_threshold = 0.6
        
        return (top_label == "shitpost") and (top_score >= shitpost_threshold)
    except Exception as e:
        print(f"Error in shitpost classification: {e}")
        # Fallback: use simple keyword matching
        return is_shitpost_fallback(template)

def is_shitpost_fallback(template):
    """
    Fallback method using simple keyword matching when AI classification fails.
    """
    shitpost_keywords = [
        'chaos', 'absurd', 'funny', 'reaction', 'meme', 'dramatic', 
        'surprised', 'angry', 'crazy', 'weird', 'strange', 'random',
        'mocking', 'sarcastic', 'roast', 'troll', 'internet', 'viral'
    ]
    
    # Check tags
    tags = template.get("tags", [])
    for tag in tags:
        if any(keyword in tag.lower() for keyword in shitpost_keywords):
            return True
    
    # Check explanation
    explanation = template.get("explanation", "").lower()
    if any(keyword in explanation for keyword in shitpost_keywords):
        return True
    
    # Check name
    name = template.get("name", "").lower()
    if any(keyword in name for keyword in shitpost_keywords):
        return True
    
    return False

def filter_shitpost_templates(templates_dict):
    """
    Filter templates to find shitpost-friendly ones using AI classification.
    
    Args:
        templates_dict: Dictionary with template keys and template data
        
    Returns:
        Dictionary containing only shitpost-friendly templates
    """
    shitpost_templates = {}
    
    print(f"Classifying {len(templates_dict)} templates for shitpost suitability...")
    
    for key, template in templates_dict.items():
        try:
            if is_shitpost(template):
                shitpost_templates[key] = template
                print(f"✓ {template.get('name', key)} - classified as shitpost-friendly")
        except Exception as e:
            print(f"✗ Error classifying {template.get('name', key)}: {e}")
            # Use fallback method
            if is_shitpost_fallback(template):
                shitpost_templates[key] = template
                print(f"✓ {template.get('name', key)} - fallback classification: shitpost-friendly")
    
    print(f"Found {len(shitpost_templates)} shitpost-friendly templates out of {len(templates_dict)} total templates")
    return shitpost_templates

def filter_shitpost_templates_batch(templates_dict, batch_size=16):
    """
    Filter templates using batch processing for better performance.
    
    Args:
        templates_dict: Dictionary with template keys and template data
        batch_size: Number of templates to process in each batch
        
    Returns:
        Dictionary containing only shitpost-friendly templates
    """
    keys = list(templates_dict.keys())
    results = {}
    
    print(f"Batch classifying {len(templates_dict)} templates for shitpost suitability...")
    
    for i in range(0, len(keys), batch_size):
        batch_keys = keys[i:i + batch_size]
        texts = []
        
        # Prepare text inputs for batch
        for k in batch_keys:
            tpl = templates_dict[k]
            tags_text = " ".join(tpl.get("tags", []))
            explanation_text = tpl.get("explanation", "")
            name_text = tpl.get("name", "")
            text_input = f"{name_text} {tags_text} {explanation_text}".strip()
            texts.append(text_input if text_input else "empty template")
        
        try:
            # Run classifier on batch
            classifier_results = classifier(texts, candidate_labels=labels)
            
            # Process results
            for k, res in zip(batch_keys, classifier_results):
                if (res["labels"][0] == "shitpost") and (res["scores"][0] >= 0.6):
                    results[k] = templates_dict[k]
                    print(f"✓ {templates_dict[k].get('name', k)} - batch classified as shitpost-friendly")
                else:
                    # Try fallback for templates that didn't make the cut
                    if is_shitpost_fallback(templates_dict[k]):
                        results[k] = templates_dict[k]
                        print(f"✓ {templates_dict[k].get('name', k)} - fallback classification: shitpost-friendly")
                        
        except Exception as e:
            print(f"Batch processing error: {e}")
            # Fallback to individual processing for this batch
            for k in batch_keys:
                if is_shitpost_fallback(templates_dict[k]):
                    results[k] = templates_dict[k]
                    print(f"✓ {templates_dict[k].get('name', k)} - error fallback: shitpost-friendly")
    
    print(f"Found {len(results)} shitpost-friendly templates out of {len(templates_dict)} total templates")
    return results

def get_shitpost_templates_with_scores(templates_dict):
    """
    Get all templates with their shitpost classification scores for analysis.
    
    Args:
        templates_dict: Dictionary with template keys and template data
        
    Returns:
        Dictionary with template keys and their classification results
    """
    results = {}
    
    for key, template in templates_dict.items():
        tags_text = " ".join(template.get("tags", []))
        explanation_text = template.get("explanation", "")
        name_text = template.get("name", "")
        text_input = f"{name_text} {tags_text} {explanation_text}".strip()
        
        if not text_input:
            results[key] = {
                "template": template,
                "score": 0.0,
                "label": "not_shitpost",
                "text_input": "empty"
            }
            continue
        
        try:
            result = classifier(text_input, candidate_labels=labels)
            results[key] = {
                "template": template,
                "score": result["scores"][0],
                "label": result["labels"][0],
                "text_input": text_input
            }
        except Exception as e:
            print(f"Error classifying {template.get('name', key)}: {e}")
            results[key] = {
                "template": template,
                "score": 0.0,
                "label": "error",
                "text_input": text_input
            }
    
    return results

# Example usage and testing
if __name__ == "__main__":
    # Example templates for testing
    example_templates = {
        "drake_hotline": {
            "name": "Drake Hotline",
            "tags": ["comparison", "choice", "preference", "better", "worse"],
            "explanation": "Perfect for comparing two choices - one gets approval, one gets rejection"
        },
        "batman_slap": {
            "name": "Batman Slap",
            "tags": ["rejection", "slap", "angry", "mad", "furious"],
            "explanation": "Perfect for rejection humor and dramatic reactions"
        },
        "distracted_bf": {
            "name": "Distracted Boyfriend",
            "tags": ["distraction", "attention", "focus", "love", "relationship"],
            "explanation": "Great for distraction scenarios and relationship humor"
        },
        "two_buttons": {
            "name": "Two Buttons",
            "tags": ["dilemma", "choice", "decision", "confused", "difficult"],
            "explanation": "Ideal for dilemmas and difficult choices"
        }
    }
    
    print("Testing shitpost classification...")
    print("=" * 50)
    
    # Test individual classification
    for key, template in example_templates.items():
        is_sp = is_shitpost(template)
        print(f"{template['name']}: {'SHITPOST' if is_sp else 'NOT SHITPOST'}")
    
    print("\n" + "=" * 50)
    
    # Test batch filtering
    filtered = filter_shitpost_templates_batch(example_templates, batch_size=2)
    print(f"\nShitpost-friendly templates found: {len(filtered)}")
    for key, template in filtered.items():
        print(f"- {template['name']}")
    
    print("\n" + "=" * 50)
    
    # Test detailed scoring
    detailed_results = get_shitpost_templates_with_scores(example_templates)
    print("\nDetailed classification results:")
    for key, result in detailed_results.items():
        template = result["template"]
        print(f"{template['name']}: {result['label']} (score: {result['score']:.3f})")
