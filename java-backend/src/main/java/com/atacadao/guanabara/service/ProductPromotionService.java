package com.atacadao.guanabara.service;

import com.atacadao.guanabara.model.ProductPromotion;
import com.atacadao.guanabara.model.Product;
import com.atacadao.guanabara.repository.ProductPromotionRepository;
import com.atacadao.guanabara.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class ProductPromotionService {
    
    private final ProductPromotionRepository promotionRepository;
    private final ProductRepository productRepository;
    
    public List<ProductPromotion> getAllPromotions() {
        return promotionRepository.findAllOrderByCreatedAtDesc();
    }
    
    public List<ProductPromotion> getActivePromotions() {
        return promotionRepository.findActivePromotions(LocalDateTime.now());
    }
    
    public Optional<ProductPromotion> getPromotionById(Long id) {
        return promotionRepository.findById(id);
    }
    
    public ProductPromotion createPromotion(ProductPromotion promotion) {
        System.out.println("Service: Recebendo promoção - " + promotion);
        
        // Verificar se o produto existe
        if (promotion.getProduct() != null && promotion.getProduct().getId() != null) {
            System.out.println("Service: Procurando produto com ID: " + promotion.getProduct().getId());
            Optional<Product> product = productRepository.findById(promotion.getProduct().getId());
            if (product.isPresent()) {
                Product foundProduct = product.get();
                System.out.println("Service: Produto encontrado - " + foundProduct.getName());
                promotion.setProduct(foundProduct);
            } else {
                System.err.println("Service: Produto não encontrado com ID: " + promotion.getProduct().getId());
                throw new RuntimeException("Produto não encontrado com ID: " + promotion.getProduct().getId());
            }
        } else {
            System.err.println("Service: Produto é null ou ID é null");
            throw new RuntimeException("Produto é obrigatório para criar uma promoção");
        }
        
        // Calcular desconto automaticamente
        if (promotion.getOriginalPrice() != null && promotion.getNewPrice() != null) {
            BigDecimal discount = promotion.getOriginalPrice()
                .subtract(promotion.getNewPrice())
                .divide(promotion.getOriginalPrice(), 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"));
            promotion.setDiscount(discount);
            System.out.println("Service: Desconto calculado: " + discount + "%");
        }
        
        ProductPromotion savedPromotion = promotionRepository.save(promotion);
        System.out.println("Service: Promoção salva com sucesso - " + savedPromotion);
        return savedPromotion;
    }
    
    public ProductPromotion updatePromotion(Long id, ProductPromotion updatedPromotion) {
        Optional<ProductPromotion> optionalPromotion = promotionRepository.findById(id);
        if (optionalPromotion.isPresent()) {
            ProductPromotion promotion = optionalPromotion.get();
            promotion.setOriginalPrice(updatedPromotion.getOriginalPrice());
            promotion.setNewPrice(updatedPromotion.getNewPrice());
            promotion.setDiscount(updatedPromotion.getDiscount());
            promotion.setImage(updatedPromotion.getImage());
            promotion.setIsActive(updatedPromotion.getIsActive());
            promotion.setValidUntil(updatedPromotion.getValidUntil());
            
            // Recalcular desconto
            if (promotion.getOriginalPrice() != null && promotion.getNewPrice() != null) {
                BigDecimal discount = promotion.getOriginalPrice()
                    .subtract(promotion.getNewPrice())
                    .divide(promotion.getOriginalPrice(), 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
                promotion.setDiscount(discount);
            }
            
            return promotionRepository.save(promotion);
        }
        throw new RuntimeException("Promoção não encontrada");
    }
    
    public void deletePromotion(Long id) {
        promotionRepository.deleteById(id);
    }
    
    public Long getActivePromotionsCount() {
        return promotionRepository.countActivePromotions();
    }
    
    public List<ProductPromotion> getPromotionsByProduct(Long productId) {
        return promotionRepository.findByProductIdAndActive(productId);
    }
    
    public ProductPromotion togglePromotionStatus(Long id) {
        Optional<ProductPromotion> optionalPromotion = promotionRepository.findById(id);
        if (optionalPromotion.isPresent()) {
            ProductPromotion promotion = optionalPromotion.get();
            promotion.setIsActive(!promotion.getIsActive());
            return promotionRepository.save(promotion);
        }
        throw new RuntimeException("Promoção não encontrada");
    }
} 